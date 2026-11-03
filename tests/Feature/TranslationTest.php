<?php

use App\Models\User;

test('guest translation requests retain the selected locale', function () {
    User::factory()->create([
        'type' => 'superadmin',
        'lang' => 'en',
    ]);

    $this->get('/translations/es')
        ->assertOk()
        ->assertJsonPath('locale', 'es')
        ->assertJsonPath('translations.Commerce types', 'Tipos de comercio');
});
