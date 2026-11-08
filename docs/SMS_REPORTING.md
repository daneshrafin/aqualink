# Offline / SMS reporting (prototype)

The `/sms` page creates a short `AQ1|ISSUE|AREA|PEOPLE|DETAILS` message. The sender can copy it or open a phone SMS app. **No SMS is transmitted or received by this application**. A real deployment needs a contracted SMS gateway/short code, receiving phone number, webhook, queue, sender privacy policy, rate limiting, consent and abuse controls, and an authenticated responder verification workflow.

The NGO intake box accepts a manually pasted message into browser-local demo reports, with `pending` status. **No GPS coordinates are included in the SMS**; the demo uses a clearly disclosed placeholder coordinate. Never dispatch using that coordinate.

A PWA/offline-first browser form with background sync is a separate feature and is **not implemented**. This composer can be used to prepare a message while online; when offline, browser caching of the page is not guaranteed. Actual SMS transmission depends on phone service, not mobile data.

Avoid sending personal details, exact home addresses or health information in unencrypted SMS. Never publish an unverified emergency intake number.
