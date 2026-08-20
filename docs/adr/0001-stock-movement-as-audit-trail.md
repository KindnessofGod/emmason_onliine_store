# Stock Movement is an audit trail, not the source of truth for Stock

Emmason wants a digital history of every restock and sale, not just a live count. The obvious "clean" design derives Stock by summing all Stock Movement rows, so there's exactly one source of truth. We rejected that: `place_order` already reads and decrements `products.stock` directly on the hot checkout path, and every other part of the app (stock checks, low-stock display) expects a plain column, not an aggregation query. Re-deriving Stock from movements on every read would mean summing an ever-growing table just to answer "is this in stock."

Instead, `products.stock` stays the number that's read and written directly, and Stock Movement is an append-only audit trail beside it, kept in sync by a database trigger. This trades a small risk of the two drifting apart (if a movement is ever written outside the trigger's path) for keeping the existing fast, simple read path untouched.
