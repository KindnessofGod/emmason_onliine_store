# Emmason Online Store

Domain glossary for Emmason Mobile Phones, Tech & Gadgets — a single-seller storefront that also runs a wholesale-buyer lead funnel and, going forward, a staff-facing inventory/cataloguing workflow.

## Language

### Product lifecycle

**Product Status**:
Where a product sits in its lifecycle: `pending_review` (captured by the field app, AI-filled, never approved by a human), `published` (live on the storefront), `unpublished` (was live, since taken down). Editing an already-`published` product does not reset it to `pending_review` — the review gate only applies to a product's first appearance.
_Avoid_: draft (ambiguous — could mean an unsaved local edit as easily as an unreviewed product), active/inactive, is_active alone

### Inventory

**Stock**:
The current on-hand quantity for a product. It's the fast-to-read number checkout and staff see; it carries no history by itself.
_Avoid_: inventory, quantity on hand

**Stock Movement**:
An append-only record of one change to a product's Stock — its type, quantity, and when it happened. Every Stock change is logged as a Stock Movement, but Stock itself remains the number that gets read and written directly; a trigger keeps the two in sync. See `docs/adr/0001-stock-movement-as-audit-trail.md` for why Stock isn't just derived from the movements.
_Avoid_: stock history, inventory log, ledger entry

**Restock** (Stock Movement type):
A Stock Movement recording goods the shop has newly taken in — bought locally or brought in from abroad — logged by hand from the dashboard or field app, with quantity and cost per unit.
_Avoid_: import, purchase, stock-in

**Sale** (Stock Movement type):
A Stock Movement written automatically when an order is placed, decrementing Stock by the ordered quantity. It's the inventory side-effect of an order, not the order itself.
_Avoid_: stock-out, decrement

**Adjustment** (Stock Movement type):
A Stock Movement correcting Stock for a reason other than a Restock or a Sale — damage, loss, or a miscount found during a physical count.
_Avoid_: correction, write-off
