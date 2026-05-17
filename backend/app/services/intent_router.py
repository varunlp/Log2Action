"""
Intent Router — Detects whether user input is a log analysis request
or a knowledge assistant query using regex heuristics.
"""
import re
from enum import Enum

class IntentType(str, Enum):
    LOG_ANALYSIS = "log_analysis"
    KNOWLEDGE = "knowledge"

# Patterns that strongly indicate log content
LOG_PATTERNS = [
    # Timestamps: 2026-05-17, [2026-05-17 10:14:24], etc.
    r'\d{4}[-/]\d{2}[-/]\d{2}[\sT]\d{2}:\d{2}',
    # Log levels
    r'\b(ERROR|WARN|WARNING|FATAL|CRITICAL|SEVERE|EXCEPTION|TRACEBACK)\b',
    # Java/Python stack traces
    r'^\s+at\s+[\w\.$]+\(', 
    r'Traceback \(most recent call last\)',
    r'File ".*", line \d+',
    # Common log prefixes
    r'^\[\d{4}[-/]\d{2}[-/]\d{2}',
    r'^\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}',
    # Error codes
    r'[A-Z]{2,10}\d{3,5}[EWI]?:',
    # Container / system log patterns
    r'(OOM|OutOfMemory|StackOverflow|NullPointer|Segfault)',
    r'(exit code|status code|return code)\s*[:=]?\s*\d+',
    # HTTP error codes in log context
    r'HTTP[/\s]\d\.\d.*\s[45]\d{2}\s',
]

COMPILED_LOG_PATTERNS = [re.compile(p, re.MULTILINE | re.IGNORECASE) for p in LOG_PATTERNS]


def detect_intent(text: str) -> IntentType:
    """
    Analyzes the input text and determines the most likely intent.
    
    Heuristic:
    - If >= 2 log patterns match, route to log analysis
    - If text has >= 5 lines AND >= 1 log pattern, route to log analysis
    - Otherwise, route to knowledge assistant
    """
    matches = sum(1 for pattern in COMPILED_LOG_PATTERNS if pattern.search(text))
    line_count = len(text.strip().split('\n'))
    
    # Strong signal: multiple log patterns detected
    if matches >= 2:
        return IntentType.LOG_ANALYSIS
    
    # Moderate signal: multi-line input with at least one log pattern
    if line_count >= 5 and matches >= 1:
        return IntentType.LOG_ANALYSIS
    
    # Default: treat as knowledge/Q&A query
    return IntentType.KNOWLEDGE
