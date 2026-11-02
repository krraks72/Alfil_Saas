<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Auth\AuthManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Inertia\Inertia;
use Illuminate\Support\Facades\File;

class LanguageController extends Controller
{
    const ALLOWED_LANGUAGES = ['en', 'es', 'pt', 'fr'];

    private function getAllowedLanguages(): array
    {
        $langListPath = resource_path('lang/language.json');
        $languages = [];

        if (File::exists($langListPath)) {
            $languages = json_decode(File::get($langListPath), true) ?? [];
        }

        return collect($languages)
            ->filter(fn ($language) => is_array($language) && in_array($language['code'] ?? null, self::ALLOWED_LANGUAGES, true))
            ->values()
            ->all();
    }

    // Show the manage language Inertia page
    public function managePage(Request $request, $lang = null)
    {
        $languages = $this->getAllowedLanguages();
        $defaultLang = 'en';
        $selectedLang = $defaultLang;
        if ($lang && collect($languages)->pluck('code')->contains($lang)) {
            $selectedLang = $lang;
        }
        $defaultData = [];
        if (File::exists(resource_path("lang/{$selectedLang}.json"))) {
            $defaultData = json_decode(File::get(resource_path("lang/{$selectedLang}.json")), true);
        }

        // Get available languages with flags and enabled status
        $availableLanguages = collect($languages)
            ->map(function ($lang) {
                return [
                    'code' => $lang['code'],
                    'name' => $lang['name'],
                    'countryCode' => $lang['countryCode'],
                    'flag' => $this->getCountryFlag($lang['countryCode']),
                    'enabled' => $lang['enabled'] ?? true
                ];
            })->values()->toArray();

        // Get current language status
        $currentLangData = collect($languages)->firstWhere('code', $selectedLang);
        $isCurrentLanguageEnabled = $currentLangData['enabled'] ?? true;

        return Inertia::render('manage-language', [
            'languages' => $languages,
            'defaultLang' => $selectedLang,
            'defaultData' => $defaultData,
            'availableLanguages' => $availableLanguages,
            'isCurrentLanguageEnabled' => $isCurrentLanguageEnabled,
        ]);
    }

    // Load a language file
    public function load(Request $request)
    {
        $languages = collect($this->getAllowedLanguages());
        $lang = $request->get('lang', 'en');
        if (!$languages->pluck('code')->contains($lang)) {
            return response()->json(['error' => __('Language not found')], 404);
        }
        $langPath = resource_path("lang/{$lang}.json");
        if (!File::exists($langPath)) {
            return response()->json(['error' => __('Language file not found')], 404);
        }
        $data = json_decode(File::get($langPath), true);
        return response()->json(['data' => $data]);
    }

    // Save a language file
    public function save(Request $request)
    {
        try {
            $languages = collect($this->getAllowedLanguages());
            $lang = $request->get('lang');
            $data = $request->get('data');
            if (!$lang || !is_array($data) || !$languages->pluck('code')->contains($lang)) {
                if ($request->expectsJson()) {
                    return response()->json(['error' => __('Invalid request')], 400);
                }
                return redirect()->back()->with('error', __('Invalid request'));
            }
            $langPath = resource_path("lang/{$lang}.json");
            if (!File::exists($langPath)) {
                if ($request->expectsJson()) {
                    return response()->json(['error' => __('Language file not found')], 404);
                }
                return redirect()->back()->with('error', __('Language file not found'));
            }
            File::put($langPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            if ($request->expectsJson()) {
                return response()->json(['success' => __('Language updated successfully')]);
            }
            return redirect()->back()->with('success', __('Language updated successfully'));
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json(['error' => __('Failed to update language file: ') . $e->getMessage()], 500);
            }
            return redirect()->back()->with('error', __('Failed to update language file: ') . $e->getMessage());
        }
    }
  public function createLanguage(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:10',
            'name' => 'required|string|max:255',
            'countryCode' => 'required|string|size:2'
        ], [
            'code.required' => __('Language code is required.'),
            'code.string' => __('Language code must be a valid string.'),
            'code.max' => __('Language code must not exceed 10 characters.'),
            'name.required' => __('Language name is required.'),
            'name.string' => __('Language name must be a valid string.'),
            'name.max' => __('Language name must not exceed 255 characters.'),
            'countryCode.required' => __('Country code is required.'),
            'countryCode.string' => __('Country code must be a valid string.'),
            'countryCode.size' => __('Country code must be exactly 2 characters.'),
        ]);

      $requestedCode = strtolower((string) $request->code);
      if (!in_array($requestedCode, self::ALLOWED_LANGUAGES, true)) {
          return response()->json(['error' => __('Only English, Spanish, Portuguese, and French are supported.')], 422);
      }

      try {
          // Check if language already exists in language.json
          $languagesFile = resource_path('lang/language.json');

            if (!is_writable($languagesFile)) {
                return response()->json(['error' => __('Language file is not writable. Please check file permissions.')], 500);
            }

            $languages = json_decode(\Illuminate\Support\Facades\File::get($languagesFile), true);

            $existingLanguage = collect($languages)->firstWhere('code', $requestedCode);
            if ($existingLanguage) {
                return response()->json(['error' => __('The language code already exists')], 422);
            }

            $languages[] = [
                'code' => $requestedCode,
                'name' => $request->name,
                'countryCode' => strtoupper($request->countryCode),
                'enabled' => true
            ];

            $result = \Illuminate\Support\Facades\File::put($languagesFile, json_encode($languages, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            if ($result === false) {
                return response()->json(['error' => __('Failed to write to language file. Please check file permissions.')], 500);
            }

            // Copy en.json to new language
            $enFile = resource_path('lang/en.json');
            $newLangFile = resource_path("lang/{$requestedCode}.json");
            if (\Illuminate\Support\Facades\File::exists($enFile)) {
                $enContent = \Illuminate\Support\Facades\File::get($enFile);
                \Illuminate\Support\Facades\File::put($newLangFile, $enContent);
            } else {
                // Create empty translation file if en.json doesn't exist
                \Illuminate\Support\Facades\File::put($newLangFile, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            }

            return response()->json(['success' => true, 'message' => __('The language has been created successfully.')]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create language: ' . $e->getMessage()], 500);
        }
    }

    public function deleteLanguage(string $languageCode)
    {
        if ($languageCode === 'en') {
            return response()->json(['error' => __('Cannot delete English language')], 422);
        }

        // try {
            // Update all users using this language to English before deletion
            \App\Models\User::where('lang', $languageCode)->update(['lang' => 'en']);

            // Remove from language.json
            $languagesFile = resource_path('lang/language.json');
            $languages = json_decode(File::get($languagesFile), true);
            $languages = array_filter($languages, fn($lang) => $lang['code'] !== $languageCode);
            File::put($languagesFile, json_encode(array_values($languages), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            // Delete main language file
            $mainLangFile = resource_path("lang/{$languageCode}.json");
            if (File::exists($mainLangFile)) {
                File::delete($mainLangFile);
            }

            return response()->json(['success' => true, 'message' => __('The language has been deleted.')]);
        // } catch (\Exception $e) {
        //     return response()->json(['error' => __('Failed to delete language: :error', ['error' => $e->getMessage()])], 500);
        // }
    }

    public function toggleLanguageStatus(string $languageCode)
    {
        if ($languageCode === 'en') {
            return response()->json(['error' => __('Cannot disable English language')], 422);
        }

        try {
            $languagesFile = resource_path('lang/language.json');
            $languages = json_decode(File::get($languagesFile), true);

            $isBeingDisabled = false;
            foreach ($languages as &$language) {
                if ($language['code'] === $languageCode) {
                    $currentStatus = $language['enabled'] ?? true;
                    $language['enabled'] = !$currentStatus;
                    $isBeingDisabled = $currentStatus; // If it was enabled, now it's being disabled
                    break;
                }
            }

            File::put($languagesFile, json_encode($languages, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            // // If language is being disabled, update all users using this language to English
            // if ($isBeingDisabled) {
            //     \App\Models\User::where('lang', $languageCode)->update(['lang' => 'en']);
            // }

            return response()->json(['success' => true, 'message' => __('The language status updated successfully.')]);
        } catch (\Exception $e) {
            return response()->json(['error' => __('Failed to update language status: :error', ['error' => $e->getMessage()])], 500);
        }
    }

    // public function changeLanguage(Request $request)
    // {
    //     $languageCode = $request->input('language');
    //     $layoutDirection = $request->input('layoutDirection');

    //     // RTL languages that should automatically set layoutDirection to 'right'
    //     $rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    //     $isRtl = in_array($languageCode, $rtlLanguages);

    //     if (config('app.is_demo')) {
    //         $response = redirect()->back()->cookie('app_language', $languageCode, 60 * 24 * 365);
            
    //         // Also set layout direction cookie for RTL languages
    //         if ($isRtl) {
    //             $response = $response->cookie('layoutDirection', 'right', 60 * 24 * 365);
    //         } else {
    //             $response = $response->cookie('layoutDirection', 'left', 60 * 24 * 365);
    //         }
            
    //         return $response;
    //     }

    //     if ($request->user()) {
    //         // Update user language
    //         $request->user()->update(['lang' => $languageCode]);

    //         // Update layout direction setting based on language
    //         if ($isRtl) {
    //             updateSetting('layoutDirection', 'right', $request->user()->id);
    //         } else {
    //             updateSetting('layoutDirection', 'left', $request->user()->id);
    //         }
    //     }

    //     return redirect()->back();
    // }
    public function changeLanguage(Request $request)
    {
        $request->validate([
            'language' => 'required|string|max:10'
        ]);
        $language = strtolower((string) $request->input('language'));

        // Validate that the language exists in our supported languages
        $languages = $this->getAllowedLanguages();
        $supportedLanguages = collect($languages)->pluck('code')->toArray();
        if (!in_array($language, $supportedLanguages, true)) {
            return response()->json(['error' => __('Language not supported')], 400);
        }
        
        // Define RTL languages
        $rtlLanguages = ['ar', 'he'];
        $isRtl = in_array($language, $rtlLanguages);
        $layoutDirection = $isRtl ? 'right' : 'left';
        
        try {
            if (config('app.is_demo')) {
                // Demo mode: Store in cookies (handled by frontend)
                return back();
            }
            
            /** @var AuthManager $authManager */
            $authManager = app(AuthManager::class);
            if ($authManager->check()) {
                $user = $authManager->user();

                // Update user's language
                $user->lang = $language;
                $user->save();
                
                // Update layout direction in settings table
                Setting::updateOrCreate(
                    [
                        'key' => 'layoutDirection',
                        'user_id' => $user->id
                    ],
                    [
                        'value' => $layoutDirection
                    ]
                );
            }
            
            return back();
        } catch (\Exception $e) {
            return back();
        }
    }

    private function getCountryFlag(string $countryCode): string
    {
        if (strlen($countryCode) !== 2) {
            return '🌐'; // Default flag for invalid codes
        }

        $codePoints = str_split(strtoupper($countryCode));
        $codePoints = array_map(fn($char) => 127397 + ord($char), $codePoints);
        return mb_convert_encoding('&#' . implode(';&#', $codePoints) . ';', 'UTF-8', 'HTML-ENTITIES');
    }
}
