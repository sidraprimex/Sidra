# SIDRA Phase 12 Acceptance Contract
- Customers and sellers create support requests only through validated Cloud Functions.
- Order context is verified before it is attached to a request.
- Only ticket participants and authorized support roles can read conversations.
- Closed requests reject further messages and cannot be reopened through an invalid transition.
- Support status changes are written to immutable audit logs.
- Notification creation remains server-only; recipients can mark their own notifications read.
- Customer and founder support surfaces include calm empty states and no placeholder conversations.
- Communication data does not expose one Studio's customer relationship to another Studio.
