import sys
import os
from pathlib import Path

root = Path(__file__).resolve().parent.parent
backend_dir = root / "backend"

sys.path.insert(0, str(root))
sys.path.insert(0, str(backend_dir))

from backend.server import app
