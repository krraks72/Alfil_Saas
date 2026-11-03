<?php

test('Laravel uses the renamed public directory', function () {
    expect(app()->publicPath())->toBe(base_path('public_html'))
        ->and(is_dir(app()->publicPath()))->toBeTrue();
});
