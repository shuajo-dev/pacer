<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\Run\StoreRunRequest;
use App\Services\Run\RunService;
use Illuminate\Http\JsonResponse;
use App\Models\Run;
use Illuminate\Support\Facades\Gate;
use App\Http\Resources\RunResource;

class RunController extends Controller
{
    //
    public function __construct(private RunService $runService){}

    public function store(StoreRunRequest $request)
    {
        $run = $this->runService->store($request->validated());

        return response()->json(New RunResource($run), 201);
    }

    public function index(Request $request) : JsonResponse
    {
        $user = $request->user();
        $runs = $user->runs()->get();

       return response()->json(RunResource::collection($runs));
    }

   public function show(Run $run): JsonResponse
    {
        Gate::authorize('view', $run);
        return response()->json(new RunResource($run));
    }

    public function update(Request $request, Run $run): JsonResponse
    {
        Gate::authorize('update', $run);

        $formattedRequest = $request->only(['distance_km', 'duration_seconds', 'notes']);

        $run->update($formattedRequest);

        return response()->json(new RunResource($run));
    }

    public function destroy(Run $run): JsonResponse
    {
        Gate::authorize('delete', $run);

        $run->delete();

        return response()->json(null, 204);
    }
}
