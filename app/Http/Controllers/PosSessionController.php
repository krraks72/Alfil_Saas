<?php

namespace App\Http\Controllers;

use App\Models\PosSession;
use App\Models\CashRegister;
use App\Models\PosCart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PosSessionController extends Controller
{
    public function store(Request $request)
    {
        try {
            $request->validate([
                'cash_register_id' => 'required|exists:cash_registers,id',
                'opening_balance' => 'required|numeric|min:0',
            ]);

            return DB::transaction(function () use ($request) {
                $user = auth()->user();
                
                // Ensure cash register belongs to the company
                $cashRegister = CashRegister::where('created_by', createdBy())
                    ->findOrFail($request->cash_register_id);
                    //dd($cashRegister);

                // Check if there's already an active session for this cash register
                $existingSession = PosSession::forCashRegister($request->cash_register_id)
                    ->active()
                    ->first();

                if ($existingSession) {
                    return response()->json([
                        'success' => false,
                        'message' => __('There is already an active session for this cash register')
                    ], 422);
                }

                // Create new POS session
                $session = PosSession::create([
                    'user_id' => $user->id,
                    'branch_id' => $cashRegister->branch_id,
                    'cash_register_id' => $request->cash_register_id,
                    'opening_balance' => $request->opening_balance,
                ]);

                // Update cash register balance
                $cashRegister->update(['current_balance' => $request->opening_balance]);

                return response()->json([
                    'success' => true,
                    'session' => $session->load(['cashRegister.branch']),
                    'message' => __('POS session started successfully')
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: __('Failed to start POS session')
            ], 500);
        }
    }

    public function close(Request $request, PosSession $session)
    {
        try {
            $request->validate([
                'closing_balance' => 'required|numeric|min:0',
                'notes' => 'nullable|string|max:1000',
            ]);

            $this->authorize('update', $session);

            if ($session->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => __('Session is already closed')
                ], 422);
            }

            $session->close($request->closing_balance, $request->notes);

            return response()->json([
                'success' => true,
                'session' => $session->fresh(),
                'message' => __('POS session closed successfully')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: __('Failed to close POS session')
            ], 500);
        }
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        // Filter sessions by company through cash register relationship
        $query = PosSession::whereHas('cashRegister', function($q) {
                $q->where('created_by', createdBy());
            })
            ->with(['cashRegister.branch'])
            ->orderBy('opened_at', 'desc');

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('opened_at', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('opened_at', '<=', $request->date_to);
        }

        $sessions = $query->paginate(20);

        return response()->json($sessions);
    }

    public function show(PosSession $session)
    {
        // Ensure session belongs to the company through cash register
        $cashRegister = $session->cashRegister;
        if (!$cashRegister || $cashRegister->created_by !== createdBy()) {
            abort(403, __('Unauthorized access to POS session.'));
        }
        
        return response()->json(
            $session->load(['cashRegister.branch', 'user', 'sales.items'])
        );
    }

    public function destroy(Request $request, PosSession $session)
    {
        try {
            // Ensure session belongs to the company through cash register
            $cashRegister = $session->cashRegister;
            if (!$cashRegister || $cashRegister->created_by !== createdBy()) {
                return redirect()->back()->with('error', __('Unauthorized access to POS session.'));
            }

            // Only allow destroying active sessions
            if ($session->status !== 'active') {
                return redirect()->back()->with('error', __('Only active sessions can be destroyed'));
            }

            // Validate current balance if provided
            $request->validate([
                'current_balance' => 'nullable|numeric|min:0'
            ]);

            // Update cash register balance if current balance provided
            if ($request->has('current_balance')) {
                $cashRegister->update(['current_balance' => $request->current_balance]);
            }

            // Delete any active cart and its items for this session
            $carts = PosCart::forSession($session->id)->get();
            foreach ($carts as $cart) {
                $cart->items()->delete();
                $cart->delete();
            }

            $session->delete();

            return redirect()->back()->with('success', __('POS session destroyed successfully'));
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to destroy POS session'));
        }
    }
}