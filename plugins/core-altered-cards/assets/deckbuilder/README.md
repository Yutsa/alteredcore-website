# Deckbuilder JS modules

Classic scripts (not ES modules) so they share one global scope — the same
contract as the previous single IIFE, without a PHP concatenator (plugin
`.php` files are denied by Apache).

Load order is defined in `pages/deckbuilder.php`.
