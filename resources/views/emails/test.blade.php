@extends('emails.layout')

@section('title', 'Test Email')

@section('content')
    <p>Hello,</p>
    
    <p>This is a test email from <strong>{{ config('app.name') }}</strong>.</p>
    
    <p>If you received this email, your email configuration is working correctly.</p>
    
    <p>Thank you!</p>
@endsection

@section('footer', 'This is an automated test email. Please do not reply.')