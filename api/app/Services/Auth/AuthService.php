<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function register (array $data): array

    {
        $user = User::create([

            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),

        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];

    }

    public function login (array $data): array

    {
        $user = Auth::attempt([
            'email' => $data['email'],
            'password' => $data['password']
        ]);


         if($user){

            $userData = Auth::user();

            $token = $userData->createToken('auth_token')->plainTextToken;

            return [
                'user' => $userData,
                'token' => $token,
            ];
         } else{
            throw new \Exception('Invalid credentials');
         }
    }

}

