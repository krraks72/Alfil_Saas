<?php

namespace App\Http\Controllers;

use App\Models\PosCart;
use App\Models\PosCartItem;
use App\Models\PosSession;
use App\Models\Product;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PosCartController extends Controller
{
    /**
     * Get or create the active cart for the current session.
     * Returns the cart with items and their product+taxes loaded.
     */
    public function getOrCreate(Request $request)
    {
        $request->validate([
            'pos_session_id' => 'required|integer|exists:pos_sessions,id',
        ]);

        $user = auth()->user();
        $session = PosSession::where('id', $request->pos_session_id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->firstOrFail();

        $cart = PosCart::forSession($session->id)
            ->forCompany(createdBy())
            ->active()
            ->with(['items.product.taxes', 'items.product.category', 'items.product.brand', 'items.product.unit', 'customer'])
            ->first();

        if (!$cart) {
            $cart = PosCart::create([
                'pos_session_id' => $session->id,
                'user_id'        => $user->id,
                'created_by'     => createdBy(),
                'status'         => 'active',
            ]);
            $cart->load(['items.product.taxes', 'items.product.category', 'items.product.brand', 'items.product.unit', 'customer']);
        }

        return response()->json(['success' => true, 'cart' => $cart]);
    }

    /**
     * Upsert a cart item (add or update quantity).
     */
    public function upsertItem(Request $request, PosCart $cart)
    {
        $this->authorizeCart($cart);

        $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'quantity'   => 'required|integer|min:1',
        ]);

        $product = Product::where('created_by', createdBy())
            ->with('taxes')
            ->findOrFail($request->product_id);

        $quantity  = min($request->quantity, $product->stock_quantity);
        $lineTotal = $quantity * $product->selling_price;

        $item = PosCartItem::updateOrCreate(
            ['pos_cart_id' => $cart->id, 'product_id' => $product->id],
            [
                'product_name' => $product->name,
                'product_sku'  => $product->sku,
                'unit_price'   => $product->selling_price,
                'quantity'     => $quantity,
                'line_total'   => $lineTotal,
            ]
        );

        return redirect()->back();
    }

    /**
     * Remove a single item from the cart.
     */
    public function removeItem(PosCart $cart, PosCartItem $item)
    {
        $this->authorizeCart($cart);

        if ($item->pos_cart_id !== $cart->id) {
            return redirect()->back()->with('error', __('Item does not belong to this cart'));
        }

        $item->delete();

        return redirect()->back()->with('success', __('Item removed from cart'));
    }

    /**
     * Update cart-level fields: customer, discount, notes.
     */
    public function update(Request $request, PosCart $cart)
    {
        $this->authorizeCart($cart);

        $request->validate([
            'customer_id'     => 'nullable|integer|exists:customers,id',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes'           => 'nullable|string|max:1000',
        ]);

        $data = [];

        if ($request->has('customer_id')) {
            // Validate customer belongs to company when provided
            if ($request->customer_id) {
                Customer::where('created_by', createdBy())->findOrFail($request->customer_id);
            }
            $data['customer_id'] = $request->customer_id;
        }

        if ($request->has('discount_amount')) {
            $data['discount_amount'] = max(0, (float) $request->discount_amount);
        }

        if ($request->has('notes')) {
            $data['notes'] = $request->notes;
        }

        $cart->update($data);

        if ($request->isMethod('post')) {
            return redirect()->back()->with('success', __('Customer updated successfully'));
        }

        return response()->json(['success' => true]);
    }

    /**
     * Clear all items from the cart (keeps the cart record active).
     */
    public function clearItems(PosCart $cart)
    {
        $this->authorizeCart($cart);

        DB::transaction(function () use ($cart) {
            $cart->items()->delete();
            $cart->update([
                'discount_amount' => 0,
                'notes'           => null,
            ]);
        });

        return redirect()->back()->with('success', __('Cart cleared successfully'));
    }

    /**
     * Ensure the cart belongs to the authenticated user's company and is active.
     */
    private function authorizeCart(PosCart $cart): void
    {
        if ($cart->created_by !== createdBy() || $cart->user_id !== auth()->id() || $cart->status !== 'active') {
            abort(403, __('Unauthorized access to cart.'));
        }
    }
}
