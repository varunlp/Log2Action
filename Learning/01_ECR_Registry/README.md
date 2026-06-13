# Phase 1: AWS Registry Foundations (ECR)

Welcome to your first hands-on DevOps lab! In this module, you will configure your local environment to connect with AWS, build the **Log2Action** container images, set up ECR (Elastic Container Registry), push the images to the cloud, and establish lifecycle/security policies.

We will keep everything self-paced and give you space to run the commands yourself. Below is your detailed lab guide.

---

## Part 1: Install AWS CLI & Configure Credentials

Before interacting with AWS, you need the AWS CLI installed on your machine.

### 1. Install AWS CLI (Linux x86_64)
Run the following commands in your terminal to install or update the AWS CLI:

```bash
# Download the installation zip file
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

# Unzip the installer
unzip awscliv2.zip

# Run the installer
sudo ./aws/install

# Verify installation
aws --version
```

### 2. Set Up IAM Credentials
To authenticate the CLI, you will need access keys from your AWS account:
1. Log in to your AWS Console.
2. Search for **IAM** (Identity and Access Management).
3. Create an IAM User (e.g., `devops-learning-user`).
4. Attach policies: For this learning path, attach **AdministratorAccess** (or at minimum `AmazonEC2ContainerRegistryFullAccess` and `AmazonVPCFullAccess` / `AmazonEKSFullAccess`).
   - *Note: In production, we follow the principle of least privilege, but for training, admin permissions help avoid policy blocking during infrastructure bootstrap.*
5. Generate **Access Key ID** and **Secret Access Key** under the user's "Security credentials" tab.

### 3. Configure local AWS CLI
Run:
```bash
aws configure
```
You will be prompted to enter:
* **AWS Access Key ID**: `your_access_key`
* **AWS Secret Access Key**: `your_secret_key`
* **Default region name**: `ap-south-1` (Mumbai region is recommended for Bangalore developers due to lower latency, or `us-east-1` / `us-west-2`)
* **Default output format**: `json`

Test your credentials by querying your caller identity:
```bash
aws sts get-caller-identity
```

---

## Part 2: Understanding and Creating ECR Repositories

### Why do we need one repository per microservice?
Amazon ECR holds container images. Unlike a folder structure, each ECR repository holds versions of *only one* application image. For the Log2Action project, we have two distinct components:
1. **log2action-backend** (Python FastAPI)
2. **log2action-frontend** (React + Nginx)

This isolation allows us to set different access controls (e.g., frontend developers can push to the frontend repo but not backend) and independent lifecycle rules.

### Create the Repositories
Run these commands to create your ECR repositories in your configured region:

```bash
# Create the Backend Repository with scanning enabled
aws ecr create-repository \
    --repository-name log2action-backend \
    --image-scanning-configuration scanOnPush=true \
    --region ap-south-1

# Create the Frontend Repository with scanning enabled
aws ecr create-repository \
    --repository-name log2action-frontend \
    --image-scanning-configuration scanOnPush=true \
    --region ap-south-1
```

> **Why `scanOnPush=true`?** This automatically triggers a static vulnerability scan (powered by Trivy/Clair) on your container image layers whenever you push a new tag, highlighting security risks before they go live.

---

## Part 3: Authenticating Docker with AWS ECR

Before pushing images, your local Docker daemon must be authorized to talk to your ECR registry. 

Your ECR registry URL follows this pattern:
`[AWS_ACCOUNT_ID].dkr.ecr.[REGION].amazonaws.com`

To login, run:
```bash
# Retrieve your AWS Account ID dynamically and log in
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="ap-south-1"

aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
```

> **How it works under the hood:** `aws ecr get-login-password` returns a temporary, encrypted authorization token valid for 12 hours. We pipe this token into `docker login` using the username `AWS`.

---

## Part 4: Building, Tagging, and Pushing Images

Now, let's build the Docker images and push them to ECR using a clean versioning pattern.

### 1. Build local Docker images
Navigate to the project root and run:
```bash
# Build backend
docker build -t log2action-backend:latest ./backend

# Build frontend
docker build -t log2action-frontend:latest ./frontend
```

### 2. Tag the images for ECR
To push an image to a private registry, you must tag it with the registry's hostname:
```bash
# Set variables
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="ap-south-1"
REGISTRY_URL="$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# Tag backend (using a semantic version e.g. v1.0.0)
docker tag log2action-backend:latest $REGISTRY_URL/log2action-backend:v1.0.0

# Tag frontend
docker tag log2action-frontend:latest $REGISTRY_URL/log2action-frontend:v1.0.0
```

### 3. Push the images to ECR
```bash
# Push backend
docker push $REGISTRY_URL/log2action-backend:v1.0.0

# Push frontend
docker push $REGISTRY_URL/log2action-frontend:v1.0.0
```

Go to your AWS Console, navigate to ECR, and verify that the repositories contain your `v1.0.0` images. Check the **Vulnerability scanning** tab to see if there are any findings!

---

## Part 5: Setting Up Lifecycle Policies

Every image version stored in ECR takes up disk space, which AWS bills at roughly **$0.10 per GB/month**. During active development, you might push dozens of builds a day, quickly inflating costs.

We will apply the lifecycle policy defined in `lifecycle-policy.json` (located in this directory) to automate cleanup:
- Rule 1: Expire untagged images older than 7 days.
- Rule 2: Keep only the 10 most recent tagged images starting with `v` (e.g., `v1.0.0`).

Apply the policy using the AWS CLI:
```bash
aws ecr put-lifecycle-policy \
    --repository-name log2action-backend \
    --lifecycle-policy-text file://lifecycle-policy.json \
    --region ap-south-1

aws ecr put-lifecycle-policy \
    --repository-name log2action-frontend \
    --lifecycle-policy-text file://lifecycle-policy.json \
    --region ap-south-1
```

---

## Part 6: Bangalore DevOps Interview Q&A (ECR & Docker)

Here are the target questions frequently asked in Bangalore DevOps interviews (e.g., at firms like Walmart, Swiggy, Cred, and target startups). Read through these and make sure you can explain them in your own words:

### Q1: How does Docker authentication work with AWS ECR in a CI/CD pipeline (e.g., GitHub Actions)? How do you avoid storing long-lived credentials?
**Answer:** 
* Traditionally, pipelines used AWS Access Key IDs and Secret Access Keys stored as credentials. This is insecure because keys can leak or expire.
* The modern, industry-standard approach is to use **OIDC (OpenID Connect)**. In GitHub Actions, you configure an IAM Role in AWS with a trust relationship pointing to your GitHub Repository. The pipeline requests a short-lived JSON Web Token (JWT) from GitHub, exchanges it with AWS Security Token Service (STS) for temporary credentials, and authenticates using the `aws-actions/configure-aws-credentials` action. No hardcoded keys are needed.

### Q2: Why should you avoid using the `:latest` tag in production environments? What is the recommended tagging strategy?
**Answer:**
* **Lack of Idempotency:** The `:latest` tag is mutable. If you deploy a pod and it crashes, and Kubernetes attempts to pull the image again, it might pull a different image than the one running on other replicas if someone pushed a new `:latest` image in the meantime. This causes configuration drift across replicas.
* **No Rollbacks:** You cannot easily rollback to a previous state because both the old and new images are represented by the same `:latest` tag.
* **Caching Issues:** Kubernetes Nodes cache image layers. If the image pull policy is not set to `Always`, Kubernetes might not pull the new version of `:latest` if it already exists on the node.
* **Recommended Strategy:** Tag images with the **Git commit SHA** (e.g., `sha-8a7e3f2`) combined with a semantic version tag (e.g., `v1.2.3`) on release, and set the ImagePullPolicy to `IfNotPresent` for fast scheduling.

### Q3: How do you optimize Docker images for size and build speeds?
**Answer:**
* **Multi-stage Builds:** Separate the build environment (which needs npm, gcc, compilers, etc.) from the runtime environment. Copy only the final compiled artifact (like `/dist` for React, or `/app` directory without devDependencies) to a minimal runtime base image.
* **Use Slim/Alpine base images:** Choose base images like `python:3.12-slim` or `nginx:alpine` instead of full ubuntu/debian images.
* **Leverage Docker Layer Caching:** Place commands that change frequently (like `COPY . .`) at the bottom of the Dockerfile, and commands that rarely change (like package installation `RUN pip install` or `RUN npm install`) at the top.
* **Exclude Unnecessary Files:** Use a `.dockerignore` file to exclude local virtualenvs, node_modules, `.git` folders, and build caches from the Docker build context.

### Q4: When a Kubernetes pod running on EKS needs to pull an image from a private ECR repository, how does it authenticate?
**Answer:**
* The EKS worker nodes run the standard Kubernetes `kubelet` process. 
* EKS nodes are associated with an AWS IAM Instance Profile. This IAM Role must have the AWS-managed policy `AmazonEC2ContainerRegistryReadOnly` attached.
* When a pod specifies an image from ECR, the `kubelet` automatically uses the AWS credential provider helper built into EKS to authenticate against ECR. The developer does not need to configure `imagePullSecrets` or manual docker credentials in the Kubernetes manifests.

---

## Action Items for You:
1. Complete Part 1: Install the AWS CLI and configure your credentials.
2. Complete Part 2 & Part 3: Create the ECR repositories and log in.
3. Complete Part 4 & Part 5: Build, tag, and push both backend and frontend images, and apply the lifecycle policies.
4. Let me know when you've done this or if you run into any command errors! We will analyze the logs together and then move to **Phase 2 (EKS Infrastructure)**.
