from datetime import datetime

from sqlalchemy.orm import Session

from app.models.refresh_tokens import RefreshToken


class RefreshTokenRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        *,
        jti: str,
        subject_type: str,
        subject_id: int,
        expires_at: datetime,
    ) -> RefreshToken:
        refresh_token = RefreshToken(
            jti=jti,
            subject_type=subject_type,
            subject_id=subject_id,
            expires_at=expires_at,
        )
        self.db.add(refresh_token)
        self.db.flush()
        return refresh_token

    def get_active(self, *, jti: str, subject_type: str) -> RefreshToken | None:
        now = datetime.utcnow()
        return (
            self.db.query(RefreshToken)
            .filter(
                RefreshToken.jti == jti,
                RefreshToken.subject_type == subject_type,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > now,
            )
            .first()
        )

    def revoke(self, refresh_token: RefreshToken) -> RefreshToken:
        refresh_token.revoked_at = datetime.utcnow()
        self.db.flush()
        return refresh_token

    def revoke_active_for_subject(self, *, subject_type: str, subject_id: int) -> int:
        now = datetime.utcnow()
        active_tokens = (
            self.db.query(RefreshToken)
            .filter(
                RefreshToken.subject_type == subject_type,
                RefreshToken.subject_id == subject_id,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > now,
            )
            .all()
        )
        for token in active_tokens:
            token.revoked_at = now
        self.db.flush()
        return len(active_tokens)
