import secrets
import string

def generate_secure_key(prefix: str = 'app_live_') -> str:
    alphabet = string.ascii_letters + string.digits
    random_chars = ''.join(secrets.choice(alphabet) for _ in range(32))
    return f"{prefix}{random_chars}"
