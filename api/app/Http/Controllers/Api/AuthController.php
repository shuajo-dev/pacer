<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\Auth\RegisterRequest;
use App\Services\Auth\AuthService;

class AuthController extends Controller
{
    //
    public function __construct(private AuthService $auth){}


    public function register (RegisterRequest $request) : JsonResponse
    {

        $userRegistration = $this->auth->register($request->validated());

        return response ()-> json($userRegistration, 201);
    }
}
