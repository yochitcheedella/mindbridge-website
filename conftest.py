import sys
import os

# Add project root to sys.path so pytest and language servers can resolve 'app' module
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
