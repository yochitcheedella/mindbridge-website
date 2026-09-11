import os
import json
try:
    import firebase_admin
    from firebase_admin import credentials, messaging
    FIREBASE_AVAILABLE = True
except ImportError:
    firebase_admin = None
    credentials = None
    messaging = None
    FIREBASE_AVAILABLE = False

from typing import Optional

# Initialize Firebase App
firebase_creds = os.getenv("FIREBASE_CREDENTIALS_JSON")

if FIREBASE_AVAILABLE and firebase_creds:
    try:
        if firebase_creds.startswith("'") and firebase_creds.endswith("'"):
            firebase_creds = firebase_creds[1:-1]
        cred_dict = json.loads(firebase_creds)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        FIREBASE_ENABLED = True
    except Exception as e:
        print(f"Failed to initialize Firebase Admin SDK: {e}")
        FIREBASE_ENABLED = False
else:
    FIREBASE_ENABLED = False


def send_push_notification(title: str, body: str, fcm_token: str, data: Optional[dict] = None) -> bool:
    """
    Sends a push notification using Firebase Cloud Messaging.
    Returns True if successful, False otherwise.
    """
    if not FIREBASE_ENABLED:
        print(f"[MOCK FCM] Sending push to {fcm_token}: {title} - {body}")
        return True

    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=fcm_token,
        )
        response = messaging.send(message)
        print(f"Successfully sent FCM message: {response}")
        return True
    except Exception as e:
        print(f"Error sending FCM message: {e}")
        return False
