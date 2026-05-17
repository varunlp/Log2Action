"""add documents, chat_messages, and document_id FK

Revision ID: a3f1b2c4d5e6
Revises: 7a8de900ca34
Create Date: 2026-05-17 14:38:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f1b2c4d5e6'
down_revision: Union[str, None] = '7a8de900ca34'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create documents table
    op.create_table(
        'documents',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('filename', sa.String(), nullable=False, index=True),
        sa.Column('file_type', sa.String(), nullable=False),
        sa.Column('chunk_count', sa.Integer(), default=0),
        sa.Column('uploaded_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Create chat_messages table
    op.create_table(
        'chat_messages',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('mode', sa.String(), nullable=False),
        sa.Column('input_text', sa.Text(), nullable=False),
        sa.Column('input_filename', sa.String(), nullable=True),
        sa.Column('response_text', sa.Text(), nullable=True),
        sa.Column('response_data', sa.JSON(), nullable=True),
        sa.Column('sources', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Add document_id FK to document_chunks
    op.add_column('document_chunks', sa.Column('document_id', sa.Integer(), sa.ForeignKey('documents.id', ondelete='CASCADE'), nullable=True))


def downgrade() -> None:
    op.drop_column('document_chunks', 'document_id')
    op.drop_table('chat_messages')
    op.drop_table('documents')
