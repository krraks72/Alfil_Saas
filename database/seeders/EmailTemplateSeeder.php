<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use App\Models\EmailTemplateLang;
use App\Models\UserEmailTemplate;
use Illuminate\Database\Seeder;

class EmailTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $languages = json_decode(file_get_contents(resource_path('lang/language.json')), true);
        $langCodes = collect($languages)->pluck('code')->toArray();

        $templates = [
            [
                'name' => 'New User',
                'from' => config('app.name'),
                'translations' => $this->getNewUserTranslations()
            ],
            [
                'name' => 'New Customer',
                'from' => config('app.name'),
                'translations' => $this->getNewCustomerTranslations()
            ],
            [
                'name' => 'New Vendor',
                'from' => config('app.name'),
                'translations' => $this->getNewVendorTranslations()
            ],
            [
                'name' => 'New Branch',
                'from' => config('app.name'),
                'translations' => $this->getNewBranchTranslations()
            ],
            [
                'name' => 'New Purchase',
                'from' => config('app.name'),
                'translations' => $this->getNewPurchaseTranslations()
            ],
            [
                'name' => 'New Purchase Return',
                'from' => config('app.name'),
                'translations' => $this->getNewPurchaseReturnTranslations()
            ],
            [
                'name' => 'New Quotation',
                'from' => config('app.name'),
                'translations' => $this->getNewQuotationTranslations()
            ],
            [
                'name' => 'Send Quotation',
                'from' => config('app.name'),
                'translations' => $this->getSendQuotationTranslations()
            ],
            [
                'name' => 'New Sale Return',
                'from' => config('app.name'),
                'translations' => $this->getNewSaleReturnTranslations()
            ],
            [
                'name' => 'New Expense',
                'from' => config('app.name'),
                'translations' => $this->getNewExpenseTranslations()
            ]
        ];

        foreach ($templates as $templateData) {
            $template = EmailTemplate::updateOrCreate(
                ['name' => $templateData['name'], 'user_id' => 1],
                ['from' => $templateData['from']]
            );

            foreach ($langCodes as $langCode) {
                $translation = $templateData['translations'][$langCode] ?? $templateData['translations']['en'];

                EmailTemplateLang::updateOrCreate(
                    ['parent_id' => $template->id, 'lang' => $langCode],
                    ['subject' => $translation['subject'], 'content' => $translation['content']]
                );
            }

            UserEmailTemplate::firstOrCreate(
                ['template_id' => $template->id, 'user_id' => 1],
                ['is_active' => true]
            );
        }
    }

    public function getNewUserTranslations(): array
    {
        return [
            'en' => [
                'subject' => 'Welcome - {user_name}',
                'content' => '<p>Hello {user_name},</p><p>Your account has been successfully created.</p><p><strong>Login Details:</strong></p><ul><li>Website: {app_url}</li><li>Email: {user_email}</li><li>Password: {user_password}</li><li>Account Type: {user_type}</li><li>Created Date: {created_date}</li></ul><p>Please keep this information secure.</p><p style="text-align: right;">Best regards,<br>{company_name}</p>'
            ],
            'es' => [
                'subject' => 'Bienvenido - {user_name}',
                'content' => '<p>Hola {user_name},</p><p>Su cuenta ha sido creada exitosamente.</p><p><strong>Detalles de Acceso:</strong></p><ul><li>Sitio web: {app_url}</li><li>Email: {user_email}</li><li>Contraseña: {user_password}</li><li>Tipo de cuenta: {user_type}</li><li>Fecha de creación: {created_date}</li></ul><p>Por favor mantenga esta información segura.</p><p style="text-align: right;">Saludos cordiales,<br>{company_name}</p>'
            ],
            'ar' => [
                'subject' => 'مرحباً - {user_name}',
                'content' => '<p>مرحباً {user_name}،</p><p>تم إنشاء حسابك بنجاح.</p><p><strong>تفاصيل تسجيل الدخول:</strong></p><ul><li>الموقع: {app_url}</li><li>البريد الإلكتروني: {user_email}</li><li>كلمة المرور: {user_password}</li><li>نوع الحساب: {user_type}</li><li>تاريخ الإنشاء: {created_date}</li></ul><p>يرجى الاحتفاظ بهذه المعلومات آمنة.</p><p style="text-align: right;">مع أطيب التحيات،<br>{company_name}</p>'
            ],
            'da' => [
                'subject' => 'Velkommen - {user_name}',
                'content' => '<p>Hej {user_name},</p><p>Din konto er blevet oprettet med succes.</p><p><strong>Login detaljer:</strong></p><ul><li>Hjemmeside: {app_url}</li><li>Email: {user_email}</li><li>Adgangskode: {user_password}</li><li>Kontotype: {user_type}</li><li>Oprettelsesdato: {created_date}</li></ul><p>Hold venligst disse oplysninger sikre.</p><p style="text-align: right;">Med venlig hilsen,<br>{company_name}</p>'
            ],
            'de' => [
                'subject' => 'Willkommen - {user_name}',
                'content' => '<p>Hallo {user_name},</p><p>Ihr Konto wurde erfolgreich erstellt.</p><p><strong>Anmeldedaten:</strong></p><ul><li>Website: {app_url}</li><li>E-Mail: {user_email}</li><li>Passwort: {user_password}</li><li>Kontotyp: {user_type}</li><li>Erstellungsdatum: {created_date}</li></ul><p>Bitte bewahren Sie diese Informationen sicher auf.</p><p style="text-align: right;">Mit freundlichen Grüßen,<br>{company_name}</p>'
            ],
            'fr' => [
                'subject' => 'Bienvenue - {user_name}',
                'content' => '<p>Bonjour {user_name},</p><p>Votre compte a été créé avec succès.</p><p><strong>Détails de connexion:</strong></p><ul><li>Site web: {app_url}</li><li>Email: {user_email}</li><li>Mot de passe: {user_password}</li><li>Type de compte: {user_type}</li><li>Date de création: {created_date}</li></ul><p>Veuillez garder ces informations en sécurité.</p><p style="text-align: right;">Cordialement,<br>{company_name}</p>'
            ],
            'he' => [
                'subject' => 'ברוכים הבאים - {user_name}',
                'content' => '<p>שלום {user_name},</p><p>החשבון שלך נוצר בהצלחה.</p><p><strong>פרטי התחברות:</strong></p><ul><li>אתר: {app_url}</li><li>אימייל: {user_email}</li><li>סיסמה: {user_password}</li><li>סוג חשבון: {user_type}</li><li>תאריך יצירה: {created_date}</li></ul><p>אנא שמרו על המידע הזה בבטחה.</p><p style="text-align: right;">בברכה,<br>{company_name}</p>'
            ],
            'it' => [
                'subject' => 'Benvenuto - {user_name}',
                'content' => '<p>Ciao {user_name},</p><p>Il tuo account è stato creato con successo.</p><p><strong>Dettagli di accesso:</strong></p><ul><li>Sito web: {app_url}</li><li>Email: {user_email}</li><li>Password: {user_password}</li><li>Tipo di account: {user_type}</li><li>Data di creazione: {created_date}</li></ul><p>Si prega di mantenere queste informazioni sicure.</p><p style="text-align: right;">Cordiali saluti,<br>{company_name}</p>'
            ],
            'ja' => [
                'subject' => 'ようこそ - {user_name}',
                'content' => '<p>こんにちは {user_name}さん、</p><p>アカウントが正常に作成されました。</p><p><strong>ログイン詳細:</strong></p><ul><li>ウェブサイト: {app_url}</li><li>メール: {user_email}</li><li>パスワード: {user_password}</li><li>アカウントタイプ: {user_type}</li><li>作成日: {created_date}</li></ul><p>この情報を安全に保管してください。</p><p style="text-align: right;">よろしくお願いします、<br>{company_name}</p>'
            ],
            'nl' => [
                'subject' => 'Welkom - {user_name}',
                'content' => '<p>Hallo {user_name},</p><p>Uw account is succesvol aangemaakt.</p><p><strong>Inloggegevens:</strong></p><ul><li>Website: {app_url}</li><li>Email: {user_email}</li><li>Wachtwoord: {user_password}</li><li>Accounttype: {user_type}</li><li>Aanmaakdatum: {created_date}</li></ul><p>Houd deze informatie veilig.</p><p style="text-align: right;">Met vriendelijke groet,<br>{company_name}</p>'
            ],
            'pl' => [
                'subject' => 'Witamy - {user_name}',
                'content' => '<p>Cześć {user_name},</p><p>Twoje konto zostało pomyślnie utworzone.</p><p><strong>Szczegóły logowania:</strong></p><ul><li>Strona internetowa: {app_url}</li><li>Email: {user_email}</li><li>Hasło: {user_password}</li><li>Typ konta: {user_type}</li><li>Data utworzenia: {created_date}</li></ul><p>Prosimy o bezpieczne przechowywanie tych informacji.</p><p style="text-align: right;">Z poważaniem,<br>{company_name}</p>'
            ],
            'pt' => [
                'subject' => 'Bem-vindo - {user_name}',
                'content' => '<p>Olá {user_name},</p><p>Sua conta foi criada com sucesso.</p><p><strong>Detalhes de Login:</strong></p><ul><li>Website: {app_url}</li><li>Email: {user_email}</li><li>Senha: {user_password}</li><li>Tipo de conta: {user_type}</li><li>Data de criação: {created_date}</li></ul><p>Por favor, mantenha essas informações seguras.</p><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'pt-BR' => [
                'subject' => 'Bem-vindo - {user_name}',
                'content' => '<p>Olá {user_name},</p><p>Sua conta foi criada com sucesso.</p><p><strong>Detalhes de Login:</strong></p><ul><li>Site: {app_url}</li><li>E-mail: {user_email}</li><li>Senha: {user_password}</li><li>Tipo de conta: {user_type}</li><li>Data de criação: {created_date}</li></ul><p>Por favor, mantenha essas informações seguras.</p><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'ru' => [
                'subject' => 'Добро пожаловать - {user_name}',
                'content' => '<p>Привет {user_name},</p><p>Ваш аккаунт был успешно создан.</p><p><strong>Данные для входа:</strong></p><ul><li>Веб-сайт: {app_url}</li><li>Email: {user_email}</li><li>Пароль: {user_password}</li><li>Тип аккаунта: {user_type}</li><li>Дата создания: {created_date}</li></ul><p>Пожалуйста, храните эту информацию в безопасности.</p><p style="text-align: right;">С наилучшими пожеланиями,<br>{company_name}</p>'
            ],
            'tr' => [
                'subject' => 'Hoş geldiniz - {user_name}',
                'content' => '<p>Merhaba {user_name},</p><p>Hesabınız başarıyla oluşturuldu.</p><p><strong>Giriş Detayları:</strong></p><ul><li>Website: {app_url}</li><li>E-posta: {user_email}</li><li>Şifre: {user_password}</li><li>Hesap Türü: {user_type}</li><li>Oluşturulma Tarihi: {created_date}</li></ul><p>Lütfen bu bilgileri güvenli tutun.</p><p style="text-align: right;">Saygılarımızla,<br>{company_name}</p>'
            ],
            'zh' => [
                'subject' => '欢迎 - {user_name}',
                'content' => '<p>您好 {user_name}，</p><p>您的账户已成功创建。</p><p><strong>登录详情：</strong></p><ul><li>网站：{app_url}</li><li>邮箱：{user_email}</li><li>密码：{user_password}</li><li>账户类型：{user_type}</li><li>创建日期：{created_date}</li></ul><p>请妥善保管这些信息。</p><p style="text-align: right;">此致敬礼，<br>{company_name}</p>'
            ]
        ];
    }

    public function getNewCustomerTranslations(): array
    {
        return [
            'en' => [
                'subject' => 'Welcome Customer - {customer_name}',
                'content' => '<p>Hello {customer_name},</p><p>Your customer account has been successfully created.</p><ul><li>Name: {customer_name}</li><li>Email: {customer_email}</li><li>Created Date: {created_date}</li></ul><p style="text-align: right;">Best regards,<br>{company_name}</p>'
            ],
            'es' => [
                'subject' => 'Bienvenido Cliente - {customer_name}',
                'content' => '<p>Hola {customer_name},</p><p>Su cuenta de cliente ha sido creada exitosamente.</p><ul><li>Nombre: {customer_name}</li><li>Email: {customer_email}</li><li>Fecha de creación: {created_date}</li></ul><p style="text-align: right;">Saludos cordiales,<br>{company_name}</p>'
            ],
            'ar' => [
                'subject' => 'مرحباً بالعميل - {customer_name}',
                'content' => '<p>مرحباً {customer_name}،</p><p>تم إنشاء حساب العميل الخاص بك بنجاح.</p><ul><li>الاسم: {customer_name}</li><li>البريد الإلكتروني: {customer_email}</li><li>تاريخ الإنشاء: {created_date}</li></ul><p style="text-align: right;">مع أطيب التحيات،<br>{company_name}</p>'
            ],
            'da' => [
                'subject' => 'Velkommen kunde - {customer_name}',
                'content' => '<p>Hej {customer_name},</p><p>Din kundekonto er blevet oprettet med succes.</p><ul><li>Navn: {customer_name}</li><li>Email: {customer_email}</li><li>Oprettelsesdato: {created_date}</li></ul><p style="text-align: right;">Med venlig hilsen,<br>{company_name}</p>'
            ],
            'de' => [
                'subject' => 'Willkommen Kunde - {customer_name}',
                'content' => '<p>Hallo {customer_name},</p><p>Ihr Kundenkonto wurde erfolgreich erstellt.</p><ul><li>Name: {customer_name}</li><li>E-Mail: {customer_email}</li><li>Erstellungsdatum: {created_date}</li></ul><p style="text-align: right;">Mit freundlichen Grüßen,<br>{company_name}</p>'
            ],
            'fr' => [
                'subject' => 'Bienvenue Client - {customer_name}',
                'content' => '<p>Bonjour {customer_name},</p><p>Votre compte client a été créé avec succès.</p><ul><li>Nom: {customer_name}</li><li>Email: {customer_email}</li><li>Date de création: {created_date}</li></ul><p style="text-align: right;">Cordialement,<br>{company_name}</p>'
            ],
            'he' => [
                'subject' => 'ברוך הבא לקוח - {customer_name}',
                'content' => '<p>שלום {customer_name},</p><p>חשבון הלקוח שלך נוצר בהצלחה.</p><ul><li>שם: {customer_name}</li><li>אימייל: {customer_email}</li><li>תאריך יצירה: {created_date}</li></ul><p style="text-align: right;">בברכה,<br>{company_name}</p>'
            ],
            'it' => [
                'subject' => 'Benvenuto Cliente - {customer_name}',
                'content' => '<p>Ciao {customer_name},</p><p>Il tuo account cliente è stato creato con successo.</p><ul><li>Nome: {customer_name}</li><li>Email: {customer_email}</li><li>Data di creazione: {created_date}</li></ul><p style="text-align: right;">Cordiali saluti,<br>{company_name}</p>'
            ],
            'ja' => [
                'subject' => 'お客様へようこそ - {customer_name}',
                'content' => '<p>こんにちは {customer_name}さん、</p><p>お客様アカウントが正常に作成されました。</p><ul><li>お名前: {customer_name}</li><li>メール: {customer_email}</li><li>作成日: {created_date}</li></ul><p style="text-align: right;">よろしくお願いします、<br>{company_name}</p>'
            ],
            'nl' => [
                'subject' => 'Welkom klant - {customer_name}',
                'content' => '<p>Hallo {customer_name},</p><p>Uw klantaccount is succesvol aangemaakt.</p><ul><li>Naam: {customer_name}</li><li>Email: {customer_email}</li><li>Aanmaakdatum: {created_date}</li></ul><p style="text-align: right;">Met vriendelijke groet,<br>{company_name}</p>'
            ],
            'pl' => [
                'subject' => 'Witamy klienta - {customer_name}',
                'content' => '<p>Cześć {customer_name},</p><p>Twoje konto klienta zostało pomyślnie utworzone.</p><ul><li>Nazwa: {customer_name}</li><li>Email: {customer_email}</li><li>Data utworzenia: {created_date}</li></ul><p style="text-align: right;">Z poważaniem,<br>{company_name}</p>'
            ],
            'pt' => [
                'subject' => 'Bem-vindo Cliente - {customer_name}',
                'content' => '<p>Olá {customer_name},</p><p>Sua conta de cliente foi criada com sucesso.</p><ul><li>Nome: {customer_name}</li><li>Email: {customer_email}</li><li>Data de criação: {created_date}</li></ul><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'pt-BR' => [
                'subject' => 'Bem-vindo Cliente - {customer_name}',
                'content' => '<p>Olá {customer_name},</p><p>Sua conta de cliente foi criada com sucesso.</p><ul><li>Nome: {customer_name}</li><li>E-mail: {customer_email}</li><li>Data de criação: {created_date}</li></ul><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'ru' => [
                'subject' => 'Добро пожаловать, клиент - {customer_name}',
                'content' => '<p>Привет {customer_name},</p><p>Ваш клиентский аккаунт был успешно создан.</p><ul><li>Имя: {customer_name}</li><li>Email: {customer_email}</li><li>Дата создания: {created_date}</li></ul><p style="text-align: right;">С наилучшими пожеланиями,<br>{company_name}</p>'
            ],
            'tr' => [
                'subject' => 'Hoş geldin müşteri - {customer_name}',
                'content' => '<p>Merhaba {customer_name},</p><p>Müşteri hesabınız başarıyla oluşturuldu.</p><ul><li>İsim: {customer_name}</li><li>E-posta: {customer_email}</li><li>Oluşturulma Tarihi: {created_date}</li></ul><p style="text-align: right;">Saygılarımızla,<br>{company_name}</p>'
            ],
            'zh' => [
                'subject' => '欢迎客户 - {customer_name}',
                'content' => '<p>您好 {customer_name}，</p><p>您的客户账户已成功创建。</p><ul><li>姓名：{customer_name}</li><li>邮箱：{customer_email}</li><li>创建日期：{created_date}</li></ul><p style="text-align: right;">此致敬礼，<br>{company_name}</p>'
            ]
        ];
    }

    public function getNewVendorTranslations(): array
    {
        return [
            'en' => [
                'subject' => 'Welcome Vendor - {vendor_name}',
                'content' => '<p>Hello {vendor_name},</p><p>Your vendor account has been successfully created.</p><ul><li>Name: {vendor_name}</li><li>Email: {vendor_email}</li><li>Created Date: {created_date}</li></ul><p style="text-align: right;">Best regards,<br>{company_name}</p>'
            ],
            'es' => [
                'subject' => 'Bienvenido Proveedor - {vendor_name}',
                'content' => '<p>Hola {vendor_name},</p><p>Su cuenta de proveedor ha sido creada exitosamente.</p><ul><li>Nombre: {vendor_name}</li><li>Email: {vendor_email}</li><li>Fecha de creación: {created_date}</li></ul><p style="text-align: right;">Saludos cordiales,<br>{company_name}</p>'
            ],
            'ar' => [
                'subject' => 'مرحباً بالمورد - {vendor_name}',
                'content' => '<p>مرحباً {vendor_name}،</p><p>تم إنشاء حساب المورد الخاص بك بنجاح.</p><ul><li>الاسم: {vendor_name}</li><li>البريد الإلكتروني: {vendor_email}</li><li>تاريخ الإنشاء: {created_date}</li></ul><p style="text-align: right;">مع أطيب التحيات،<br>{company_name}</p>'
            ],
            'da' => [
                'subject' => 'Velkommen leverandør - {vendor_name}',
                'content' => '<p>Hej {vendor_name},</p><p>Din leverandørkonto er blevet oprettet med succes.</p><ul><li>Navn: {vendor_name}</li><li>Email: {vendor_email}</li><li>Oprettelsesdato: {created_date}</li></ul><p style="text-align: right;">Med venlig hilsen,<br>{company_name}</p>'
            ],
            'de' => [
                'subject' => 'Willkommen Lieferant - {vendor_name}',
                'content' => '<p>Hallo {vendor_name},</p><p>Ihr Lieferantenkonto wurde erfolgreich erstellt.</p><ul><li>Name: {vendor_name}</li><li>E-Mail: {vendor_email}</li><li>Erstellungsdatum: {created_date}</li></ul><p style="text-align: right;">Mit freundlichen Grüßen,<br>{company_name}</p>'
            ],
            'fr' => [
                'subject' => 'Bienvenue Fournisseur - {vendor_name}',
                'content' => '<p>Bonjour {vendor_name},</p><p>Votre compte fournisseur a été créé avec succès.</p><ul><li>Nom: {vendor_name}</li><li>Email: {vendor_email}</li><li>Date de création: {created_date}</li></ul><p style="text-align: right;">Cordialement,<br>{company_name}</p>'
            ],
            'he' => [
                'subject' => 'ברוך הבא ספק - {vendor_name}',
                'content' => '<p>שלום {vendor_name},</p><p>חשבון הספק שלך נוצר בהצלחה.</p><ul><li>שם: {vendor_name}</li><li>אימייל: {vendor_email}</li><li>תאריך יצירה: {created_date}</li></ul><p style="text-align: right;">בברכה,<br>{company_name}</p>'
            ],
            'it' => [
                'subject' => 'Benvenuto Fornitore - {vendor_name}',
                'content' => '<p>Ciao {vendor_name},</p><p>Il tuo account fornitore è stato creato con successo.</p><ul><li>Nome: {vendor_name}</li><li>Email: {vendor_email}</li><li>Data di creazione: {created_date}</li></ul><p style="text-align: right;">Cordiali saluti,<br>{company_name}</p>'
            ],
            'ja' => [
                'subject' => 'ベンダー様へようこそ - {vendor_name}',
                'content' => '<p>こんにちは {vendor_name}さん、</p><p>ベンダーアカウントが正常に作成されました。</p><ul><li>お名前: {vendor_name}</li><li>メール: {vendor_email}</li><li>作成日: {created_date}</li></ul><p style="text-align: right;">よろしくお願いします、<br>{company_name}</p>'
            ],
            'nl' => [
                'subject' => 'Welkom leverancier - {vendor_name}',
                'content' => '<p>Hallo {vendor_name},</p><p>Uw leveranciersaccount is succesvol aangemaakt.</p><ul><li>Naam: {vendor_name}</li><li>Email: {vendor_email}</li><li>Aanmaakdatum: {created_date}</li></ul><p style="text-align: right;">Met vriendelijke groet,<br>{company_name}</p>'
            ],
            'pl' => [
                'subject' => 'Witamy dostawcę - {vendor_name}',
                'content' => '<p>Cześć {vendor_name},</p><p>Twoje konto dostawcy zostało pomyślnie utworzone.</p><ul><li>Nazwa: {vendor_name}</li><li>Email: {vendor_email}</li><li>Data utworzenia: {created_date}</li></ul><p style="text-align: right;">Z poważaniem,<br>{company_name}</p>'
            ],
            'pt' => [
                'subject' => 'Bem-vindo Fornecedor - {vendor_name}',
                'content' => '<p>Olá {vendor_name},</p><p>Sua conta de fornecedor foi criada com sucesso.</p><ul><li>Nome: {vendor_name}</li><li>Email: {vendor_email}</li><li>Data de criação: {created_date}</li></ul><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'pt-BR' => [
                'subject' => 'Bem-vindo Fornecedor - {vendor_name}',
                'content' => '<p>Olá {vendor_name},</p><p>Sua conta de fornecedor foi criada com sucesso.</p><ul><li>Nome: {vendor_name}</li><li>E-mail: {vendor_email}</li><li>Data de criação: {created_date}</li></ul><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'ru' => [
                'subject' => 'Добро пожаловать, поставщик - {vendor_name}',
                'content' => '<p>Привет {vendor_name},</p><p>Ваш аккаунт поставщика был успешно создан.</p><ul><li>Имя: {vendor_name}</li><li>Email: {vendor_email}</li><li>Дата создания: {created_date}</li></ul><p style="text-align: right;">С наилучшими пожеланиями,<br>{company_name}</p>'
            ],
            'tr' => [
                'subject' => 'Hoş geldin tedarikçi - {vendor_name}',
                'content' => '<p>Merhaba {vendor_name},</p><p>Tedarikçi hesabınız başarıyla oluşturuldu.</p><ul><li>İsim: {vendor_name}</li><li>E-posta: {vendor_email}</li><li>Oluşturulma Tarihi: {created_date}</li></ul><p style="text-align: right;">Saygılarımızla,<br>{company_name}</p>'
            ],
            'zh' => [
                'subject' => '欢迎供应商 - {vendor_name}',
                'content' => '<p>您好 {vendor_name}，</p><p>您的供应商账户已成功创建。</p><ul><li>姓名：{vendor_name}</li><li>邮箱：{vendor_email}</li><li>创建日期：{created_date}</li></ul><p style="text-align: right;">此致敬礼，<br>{company_name}</p>'
            ]
        ];
    }

    public function getNewBranchTranslations(): array
    {
        return [
            'en' => [
                'subject' => 'New Branch Created - {branch_name}',
                'content' => '<p>Hello,</p><p>A new branch has been successfully created.</p><p><strong>Branch Details:</strong></p><ul><li>Name: {branch_name}</li><li>Email: {branch_email}</li><li>Address: {branch_address}</li><li>Phone: {branch_phone}</li><li>Manager: {manager_name}</li><li>Created Date: {created_date}</li></ul><p style="text-align: right;">Best regards,<br>{company_name}</p>'
            ],
            'es' => [
                'subject' => 'Nueva Sucursal Creada - {branch_name}',
                'content' => '<p>Hola,</p><p>Una nueva sucursal ha sido creada exitosamente.</p><p><strong>Detalles de la Sucursal:</strong></p><ul><li>Nombre: {branch_name}</li><li>Email: {branch_email}</li><li>Dirección: {branch_address}</li><li>Teléfono: {branch_phone}</li><li>Gerente: {manager_name}</li><li>Fecha de creación: {created_date}</li></ul><p style="text-align: right;">Saludos cordiales,<br>{company_name}</p>'
            ],
            'ar' => [
                'subject' => 'تم إنشاء فرع جديد - {branch_name}',
                'content' => '<p>مرحباً،</p><p>تم إنشاء فرع جديد بنجاح.</p><p><strong>تفاصيل الفرع:</strong></p><ul><li>الاسم: {branch_name}</li><li>البريد الإلكتروني: {branch_email}</li><li>العنوان: {branch_address}</li><li>الهاتف: {branch_phone}</li><li>المدير: {manager_name}</li><li>تاريخ الإنشاء: {created_date}</li></ul><p style="text-align: right;">مع أطيب التحيات،<br>{company_name}</p>'
            ],
            'da' => [
                'subject' => 'Ny filial oprettet - {branch_name}',
                'content' => '<p>Hej,</p><p>En ny filial er blevet oprettet med succes.</p><p><strong>Filial detaljer:</strong></p><ul><li>Navn: {branch_name}</li><li>Email: {branch_email}</li><li>Adresse: {branch_address}</li><li>Telefon: {branch_phone}</li><li>Manager: {manager_name}</li><li>Oprettelsesdato: {created_date}</li></ul><p style="text-align: right;">Med venlig hilsen,<br>{company_name}</p>'
            ],
            'de' => [
                'subject' => 'Neue Filiale erstellt - {branch_name}',
                'content' => '<p>Hallo,</p><p>Eine neue Filiale wurde erfolgreich erstellt.</p><p><strong>Filial-Details:</strong></p><ul><li>Name: {branch_name}</li><li>E-Mail: {branch_email}</li><li>Adresse: {branch_address}</li><li>Telefon: {branch_phone}</li><li>Manager: {manager_name}</li><li>Erstellungsdatum: {created_date}</li></ul><p style="text-align: right;">Mit freundlichen Grüßen,<br>{company_name}</p>'
            ],
            'fr' => [
                'subject' => 'Nouvelle succursale créée - {branch_name}',
                'content' => '<p>Bonjour,</p><p>Une nouvelle succursale a été créée avec succès.</p><p><strong>Détails de la succursale:</strong></p><ul><li>Nom: {branch_name}</li><li>Email: {branch_email}</li><li>Adresse: {branch_address}</li><li>Téléphone: {branch_phone}</li><li>Manager: {manager_name}</li><li>Date de création: {created_date}</li></ul><p style="text-align: right;">Cordialement,<br>{company_name}</p>'
            ],
            'he' => [
                'subject' => 'סניף חדש נוצר - {branch_name}',
                'content' => '<p>שלום,</p><p>סניף חדש נוצר בהצלחה.</p><p><strong>פרטי הסניף:</strong></p><ul><li>שם: {branch_name}</li><li>אימייל: {branch_email}</li><li>כתובת: {branch_address}</li><li>טלפון: {branch_phone}</li><li>מנהל: {manager_name}</li><li>תאריך יצירה: {created_date}</li></ul><p style="text-align: right;">בברכה,<br>{company_name}</p>'
            ],
            'it' => [
                'subject' => 'Nuova filiale creata - {branch_name}',
                'content' => '<p>Ciao,</p><p>Una nuova filiale è stata creata con successo.</p><p><strong>Dettagli della filiale:</strong></p><ul><li>Nome: {branch_name}</li><li>Email: {branch_email}</li><li>Indirizzo: {branch_address}</li><li>Telefono: {branch_phone}</li><li>Manager: {manager_name}</li><li>Data di creazione: {created_date}</li></ul><p style="text-align: right;">Cordiali saluti,<br>{company_name}</p>'
            ],
            'ja' => [
                'subject' => '新しい支店が作成されました - {branch_name}',
                'content' => '<p>こんにちは、</p><p>新しい支店が正常に作成されました。</p><p><strong>支店詳細:</strong></p><ul><li>名前: {branch_name}</li><li>メール: {branch_email}</li><li>住所: {branch_address}</li><li>電話: {branch_phone}</li><li>マネージャー: {manager_name}</li><li>作成日: {created_date}</li></ul><p style="text-align: right;">よろしくお願いします、<br>{company_name}</p>'
            ],
            'nl' => [
                'subject' => 'Nieuwe vestiging aangemaakt - {branch_name}',
                'content' => '<p>Hallo,</p><p>Een nieuwe vestiging is succesvol aangemaakt.</p><p><strong>Vestiging details:</strong></p><ul><li>Naam: {branch_name}</li><li>Email: {branch_email}</li><li>Adres: {branch_address}</li><li>Telefoon: {branch_phone}</li><li>Manager: {manager_name}</li><li>Aanmaakdatum: {created_date}</li></ul><p style="text-align: right;">Met vriendelijke groet,<br>{company_name}</p>'
            ],
            'pl' => [
                'subject' => 'Utworzono nowy oddział - {branch_name}',
                'content' => '<p>Cześć,</p><p>Nowy oddział został pomyślnie utworzony.</p><p><strong>Szczegóły oddziału:</strong></p><ul><li>Nazwa: {branch_name}</li><li>Email: {branch_email}</li><li>Adres: {branch_address}</li><li>Telefon: {branch_phone}</li><li>Manager: {manager_name}</li><li>Data utworzenia: {created_date}</li></ul><p style="text-align: right;">Z poważaniem,<br>{company_name}</p>'
            ],
            'pt' => [
                'subject' => 'Nova filial criada - {branch_name}',
                'content' => '<p>Olá,</p><p>Uma nova filial foi criada com sucesso.</p><p><strong>Detalhes da filial:</strong></p><ul><li>Nome: {branch_name}</li><li>Email: {branch_email}</li><li>Endereço: {branch_address}</li><li>Telefone: {branch_phone}</li><li>Gerente: {manager_name}</li><li>Data de criação: {created_date}</li></ul><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'pt-BR' => [
                'subject' => 'Nova filial criada - {branch_name}',
                'content' => '<p>Olá,</p><p>Uma nova filial foi criada com sucesso.</p><p><strong>Detalhes da filial:</strong></p><ul><li>Nome: {branch_name}</li><li>E-mail: {branch_email}</li><li>Endereço: {branch_address}</li><li>Telefone: {branch_phone}</li><li>Gerente: {manager_name}</li><li>Data de criação: {created_date}</li></ul><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'ru' => [
                'subject' => 'Создан новый филиал - {branch_name}',
                'content' => '<p>Привет,</p><p>Новый филиал был успешно создан.</p><p><strong>Детали филиала:</strong></p><ul><li>Название: {branch_name}</li><li>Email: {branch_email}</li><li>Адрес: {branch_address}</li><li>Телефон: {branch_phone}</li><li>Менеджер: {manager_name}</li><li>Дата создания: {created_date}</li></ul><p style="text-align: right;">С наилучшими пожеланиями,<br>{company_name}</p>'
            ],
            'tr' => [
                'subject' => 'Yeni şube oluşturuldu - {branch_name}',
                'content' => '<p>Merhaba,</p><p>Yeni bir şube başarıyla oluşturuldu.</p><p><strong>Şube detayları:</strong></p><ul><li>İsim: {branch_name}</li><li>E-posta: {branch_email}</li><li>Adres: {branch_address}</li><li>Telefon: {branch_phone}</li><li>Yönetici: {manager_name}</li><li>Oluşturulma Tarihi: {created_date}</li></ul><p style="text-align: right;">Saygılarımızla,<br>{company_name}</p>'
            ],
            'zh' => [
                'subject' => '新分支机构已创建 - {branch_name}',
                'content' => '<p>您好，</p><p>新分支机构已成功创建。</p><p><strong>分支机构详情：</strong></p><ul><li>名称：{branch_name}</li><li>邮箱：{branch_email}</li><li>地址：{branch_address}</li><li>电话：{branch_phone}</li><li>经理：{manager_name}</li><li>创建日期：{created_date}</li></ul><p style="text-align: right;">此致敬礼，<br>{company_name}</p>'
            ]
        ];
    }

    public function getNewPurchaseTranslations(): array
    {
        return [
            'en' => [
                'subject' => 'New Purchase Order - {purchase_number}',
                'content' => '<p>Hello {vendor_name},</p><p>A new purchase order has been created.</p><p><strong>Purchase Details:</strong></p><ul><li>Purchase Number: {purchase_number}</li><li>Vendor: {vendor_name}</li><li>Purchase Date: {purchase_date}</li><li>Total Amount: {total_amount}</li><li>Created Date: {created_date}</li></ul><p style="text-align: right;">Best regards,<br>{company_name}</p>'
            ],
            'es' => [
                'subject' => 'Nueva Orden de Compra - {purchase_number}',
                'content' => '<p>Hola {vendor_name},</p><p>Se ha creado una nueva orden de compra.</p><p><strong>Detalles de la Compra:</strong></p><ul><li>Número de Compra: {purchase_number}</li><li>Proveedor: {vendor_name}</li><li>Fecha de Compra: {purchase_date}</li><li>Monto Total: {total_amount}</li><li>Fecha de Creación: {created_date}</li></ul><p style="text-align: right;">Saludos cordiales,<br>{company_name}</p>'
            ],
            'ar' => [
                'subject' => 'أمر شراء جديد - {purchase_number}',
                'content' => '<p>مرحباً {vendor_name}،</p><p>تم إنشاء أمر شراء جديد.</p><p><strong>تفاصيل الشراء:</strong></p><ul><li>رقم الشراء: {purchase_number}</li><li>المورد: {vendor_name}</li><li>تاريخ الشراء: {purchase_date}</li><li>المبلغ الإجمالي: {total_amount}</li><li>تاريخ الإنشاء: {created_date}</li></ul><p style="text-align: right;">مع أطيب التحيات،<br>{company_name}</p>'
            ],
            'da' => [
                'subject' => 'Ny indkøbsordre - {purchase_number}',
                'content' => '<p>Hej {vendor_name},</p><p>En ny indkøbsordre er blevet oprettet.</p><p><strong>Indkøbsdetaljer:</strong></p><ul><li>Indkøbsnummer: {purchase_number}</li><li>Leverandør: {vendor_name}</li><li>Indkøbsdato: {purchase_date}</li><li>Samlet beløb: {total_amount}</li><li>Oprettelsesdato: {created_date}</li></ul><p style="text-align: right;">Med venlig hilsen,<br>{company_name}</p>'
            ],
            'de' => [
                'subject' => 'Neue Bestellung - {purchase_number}',
                'content' => '<p>Hallo {vendor_name},</p><p>Eine neue Bestellung wurde erstellt.</p><p><strong>Bestelldetails:</strong></p><ul><li>Bestellnummer: {purchase_number}</li><li>Lieferant: {vendor_name}</li><li>Bestelldatum: {purchase_date}</li><li>Gesamtbetrag: {total_amount}</li><li>Erstellungsdatum: {created_date}</li></ul><p style="text-align: right;">Mit freundlichen Grüßen,<br>{company_name}</p>'
            ],
            'fr' => [
                'subject' => 'Nouvelle commande d\'achat - {purchase_number}',
                'content' => '<p>Bonjour {vendor_name},</p><p>Une nouvelle commande d\'achat a été créée.</p><p><strong>Détails de l\'achat:</strong></p><ul><li>Numéro d\'achat: {purchase_number}</li><li>Fournisseur: {vendor_name}</li><li>Date d\'achat: {purchase_date}</li><li>Montant total: {total_amount}</li><li>Date de création: {created_date}</li></ul><p style="text-align: right;">Cordialement,<br>{company_name}</p>'
            ],
            'he' => [
                'subject' => 'הזמנת רכש חדשה - {purchase_number}',
                'content' => '<p>שלום {vendor_name},</p><p>הזמנת רכש חדשה נוצרה.</p><p><strong>פרטי הרכש:</strong></p><ul><li>מספר רכש: {purchase_number}</li><li>ספק: {vendor_name}</li><li>תאריך רכש: {purchase_date}</li><li>סכום כולל: {total_amount}</li><li>תאריך יצירה: {created_date}</li></ul><p style="text-align: right;">בברכה,<br>{company_name}</p>'
            ],
            'it' => [
                'subject' => 'Nuovo ordine di acquisto - {purchase_number}',
                'content' => '<p>Ciao {vendor_name},</p><p>È stato creato un nuovo ordine di acquisto.</p><p><strong>Dettagli dell\'acquisto:</strong></p><ul><li>Numero acquisto: {purchase_number}</li><li>Fornitore: {vendor_name}</li><li>Data acquisto: {purchase_date}</li><li>Importo totale: {total_amount}</li><li>Data di creazione: {created_date}</li></ul><p style="text-align: right;">Cordiali saluti,<br>{company_name}</p>'
            ],
            'ja' => [
                'subject' => '新しい発注書 - {purchase_number}',
                'content' => '<p>こんにちは {vendor_name}さん、</p><p>新しい発注書が作成されました。</p><p><strong>発注詳細:</strong></p><ul><li>発注番号: {purchase_number}</li><li>ベンダー: {vendor_name}</li><li>発注日: {purchase_date}</li><li>合計金額: {total_amount}</li><li>作成日: {created_date}</li></ul><p style="text-align: right;">よろしくお願いします、<br>{company_name}</p>'
            ],
            'nl' => [
                'subject' => 'Nieuwe inkooporder - {purchase_number}',
                'content' => '<p>Hallo {vendor_name},</p><p>Een nieuwe inkooporder is aangemaakt.</p><p><strong>Inkoopdetails:</strong></p><ul><li>Inkoop nummer: {purchase_number}</li><li>Leverancier: {vendor_name}</li><li>Inkoopdatum: {purchase_date}</li><li>Totaalbedrag: {total_amount}</li><li>Aanmaakdatum: {created_date}</li></ul><p style="text-align: right;">Met vriendelijke groet,<br>{company_name}</p>'
            ],
            'pl' => [
                'subject' => 'Nowe zamówienie zakupu - {purchase_number}',
                'content' => '<p>Cześć {vendor_name},</p><p>Zostało utworzone nowe zamówienie zakupu.</p><p><strong>Szczegóły zakupu:</strong></p><ul><li>Numer zakupu: {purchase_number}</li><li>Dostawca: {vendor_name}</li><li>Data zakupu: {purchase_date}</li><li>Łączna kwota: {total_amount}</li><li>Data utworzenia: {created_date}</li></ul><p style="text-align: right;">Z poważaniem,<br>{company_name}</p>'
            ],
            'pt' => [
                'subject' => 'Nova ordem de compra - {purchase_number}',
                'content' => '<p>Olá {vendor_name},</p><p>Uma nova ordem de compra foi criada.</p><p><strong>Detalhes da compra:</strong></p><ul><li>Número da compra: {purchase_number}</li><li>Fornecedor: {vendor_name}</li><li>Data da compra: {purchase_date}</li><li>Valor total: {total_amount}</li><li>Data de criação: {created_date}</li></ul><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'pt-BR' => [
                'subject' => 'Nova ordem de compra - {purchase_number}',
                'content' => '<p>Olá {vendor_name},</p><p>Uma nova ordem de compra foi criada.</p><p><strong>Detalhes da compra:</strong></p><ul><li>Número da compra: {purchase_number}</li><li>Fornecedor: {vendor_name}</li><li>Data da compra: {purchase_date}</li><li>Valor total: {total_amount}</li><li>Data de criação: {created_date}</li></ul><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'ru' => [
                'subject' => 'Новый заказ на покупку - {purchase_number}',
                'content' => '<p>Привет {vendor_name},</p><p>Создан новый заказ на покупку.</p><p><strong>Детали покупки:</strong></p><ul><li>Номер покупки: {purchase_number}</li><li>Поставщик: {vendor_name}</li><li>Дата покупки: {purchase_date}</li><li>Общая сумма: {total_amount}</li><li>Дата создания: {created_date}</li></ul><p style="text-align: right;">С наилучшими пожеланиями,<br>{company_name}</p>'
            ],
            'tr' => [
                'subject' => 'Yeni satın alma siparişi - {purchase_number}',
                'content' => '<p>Merhaba {vendor_name},</p><p>Yeni bir satın alma siparişi oluşturuldu.</p><p><strong>Satın alma detayları:</strong></p><ul><li>Satın alma numarası: {purchase_number}</li><li>Tedarikçi: {vendor_name}</li><li>Satın alma tarihi: {purchase_date}</li><li>Toplam tutar: {total_amount}</li><li>Oluşturulma tarihi: {created_date}</li></ul><p style="text-align: right;">Saygılarımızla,<br>{company_name}</p>'
            ],
            'zh' => [
                'subject' => '新采购订单 - {purchase_number}',
                'content' => '<p>您好 {vendor_name}，</p><p>已创建新的采购订单。</p><p><strong>采购详情：</strong></p><ul><li>采购编号：{purchase_number}</li><li>供应商：{vendor_name}</li><li>采购日期：{purchase_date}</li><li>总金额：{total_amount}</li><li>创建日期：{created_date}</li></ul><p style="text-align: right;">此致敬礼，<br>{company_name}</p>'
            ]
        ];
    }

    public function getNewPurchaseReturnTranslations(): array
    {
        return [
            'en' => [
                'subject' => 'Purchase Return - {return_number}',
                'content' => '<p>Hello {vendor_name},</p><p>A purchase return has been created for your order.</p><p><strong>Return Details:</strong></p><ul><li>Return Number: {return_number}</li><li>Original Purchase: {purchase_number}</li><li>Vendor: {vendor_name}</li><li>Return Date: {return_date}</li><li>Return Amount: {total_amount}</li><li>Reason: {reason}</li><li>Created Date: {created_date}</li></ul><p style="text-align: right;">Best regards,<br>{company_name}</p>'
            ],
            'es' => [
                'subject' => 'Devolución de Compra - {return_number}',
                'content' => '<p>Hola {vendor_name},</p><p>Se ha creado una devolución de compra para su pedido.</p><p><strong>Detalles de la Devolución:</strong></p><ul><li>Número de Devolución: {return_number}</li><li>Compra Original: {purchase_number}</li><li>Proveedor: {vendor_name}</li><li>Fecha de Devolución: {return_date}</li><li>Monto de Devolución: {total_amount}</li><li>Razón: {reason}</li><li>Fecha de Creación: {created_date}</li></ul><p style="text-align: right;">Saludos cordiales,<br>{company_name}</p>'
            ],
            'ar' => [
                'subject' => 'إرجاع شراء - {return_number}',
                'content' => '<p>مرحباً {vendor_name}،</p><p>تم إنشاء إرجاع شراء لطلبك.</p><p><strong>تفاصيل الإرجاع:</strong></p><ul><li>رقم الإرجاع: {return_number}</li><li>الشراء الأصلي: {purchase_number}</li><li>المورد: {vendor_name}</li><li>تاريخ الإرجاع: {return_date}</li><li>مبلغ الإرجاع: {total_amount}</li><li>السبب: {reason}</li><li>تاريخ الإنشاء: {created_date}</li></ul><p style="text-align: right;">مع أطيب التحيات،<br>{company_name}</p>'
            ],
            'da' => [
                'subject' => 'Indkøbsretur - {return_number}',
                'content' => '<p>Hej {vendor_name},</p><p>En indkøbsretur er blevet oprettet for din ordre.</p><p><strong>Returdetaljer:</strong></p><ul><li>Returnummer: {return_number}</li><li>Oprindelig indkøb: {purchase_number}</li><li>Leverandør: {vendor_name}</li><li>Returdato: {return_date}</li><li>Returbeløb: {total_amount}</li><li>Årsag: {reason}</li><li>Oprettelsesdato: {created_date}</li></ul><p style="text-align: right;">Med venlig hilsen,<br>{company_name}</p>'
            ],
            'de' => [
                'subject' => 'Einkaufsrückgabe - {return_number}',
                'content' => '<p>Hallo {vendor_name},</p><p>Eine Einkaufsrückgabe wurde für Ihre Bestellung erstellt.</p><p><strong>Rückgabedetails:</strong></p><ul><li>Rückgabenummer: {return_number}</li><li>Ursprünglicher Einkauf: {purchase_number}</li><li>Lieferant: {vendor_name}</li><li>Rückgabedatum: {return_date}</li><li>Rückgabebetrag: {total_amount}</li><li>Grund: {reason}</li><li>Erstellungsdatum: {created_date}</li></ul><p style="text-align: right;">Mit freundlichen Grüßen,<br>{company_name}</p>'
            ],
            'fr' => [
                'subject' => 'Retour d\'achat - {return_number}',
                'content' => '<p>Bonjour {vendor_name},</p><p>Un retour d\'achat a été créé pour votre commande.</p><p><strong>Détails du retour:</strong></p><ul><li>Numéro de retour: {return_number}</li><li>Achat original: {purchase_number}</li><li>Fournisseur: {vendor_name}</li><li>Date de retour: {return_date}</li><li>Montant du retour: {total_amount}</li><li>Raison: {reason}</li><li>Date de création: {created_date}</li></ul><p style="text-align: right;">Cordialement,<br>{company_name}</p>'
            ],
            'he' => [
                'subject' => 'החזרת רכש - {return_number}',
                'content' => '<p>שלום {vendor_name},</p><p>החזרת רכש נוצרה עבור הזמנתך.</p><p><strong>פרטי החזרה:</strong></p><ul><li>מספר החזרה: {return_number}</li><li>רכש מקורי: {purchase_number}</li><li>ספק: {vendor_name}</li><li>תאריך החזרה: {return_date}</li><li>סכום החזרה: {total_amount}</li><li>סיבה: {reason}</li><li>תאריך יצירה: {created_date}</li></ul><p style="text-align: right;">בברכה,<br>{company_name}</p>'
            ],
            'it' => [
                'subject' => 'Reso acquisto - {return_number}',
                'content' => '<p>Ciao {vendor_name},</p><p>È stato creato un reso acquisto per il tuo ordine.</p><p><strong>Dettagli del reso:</strong></p><ul><li>Numero reso: {return_number}</li><li>Acquisto originale: {purchase_number}</li><li>Fornitore: {vendor_name}</li><li>Data reso: {return_date}</li><li>Importo reso: {total_amount}</li><li>Motivo: {reason}</li><li>Data di creazione: {created_date}</li></ul><p style="text-align: right;">Cordiali saluti,<br>{company_name}</p>'
            ],
            'ja' => [
                'subject' => '購入返品 - {return_number}',
                'content' => '<p>こんにちは {vendor_name}さん、</p><p>ご注文の購入返品が作成されました。</p><p><strong>返品詳細:</strong></p><ul><li>返品番号: {return_number}</li><li>元の購入: {purchase_number}</li><li>ベンダー: {vendor_name}</li><li>返品日: {return_date}</li><li>返品金額: {total_amount}</li><li>理由: {reason}</li><li>作成日: {created_date}</li></ul><p style="text-align: right;">よろしくお願いします、<br>{company_name}</p>'
            ],
            'nl' => [
                'subject' => 'Inkoopretour - {return_number}',
                'content' => '<p>Hallo {vendor_name},</p><p>Een inkoopretour is aangemaakt voor je bestelling.</p><p><strong>Retourdetails:</strong></p><ul><li>Retournummer: {return_number}</li><li>Oorspronkelijke inkoop: {purchase_number}</li><li>Leverancier: {vendor_name}</li><li>Retourdatum: {return_date}</li><li>Retourbedrag: {total_amount}</li><li>Reden: {reason}</li><li>Aanmaakdatum: {created_date}</li></ul><p style="text-align: right;">Met vriendelijke groet,<br>{company_name}</p>'
            ],
            'pl' => [
                'subject' => 'Zwrot zakupu - {return_number}',
                'content' => '<p>Cześć {vendor_name},</p><p>Został utworzony zwrot zakupu dla Twojego zamówienia.</p><p><strong>Szczegóły zwrotu:</strong></p><ul><li>Numer zwrotu: {return_number}</li><li>Oryginalny zakup: {purchase_number}</li><li>Dostawca: {vendor_name}</li><li>Data zwrotu: {return_date}</li><li>Kwota zwrotu: {total_amount}</li><li>Powód: {reason}</li><li>Data utworzenia: {created_date}</li></ul><p style="text-align: right;">Z poważaniem,<br>{company_name}</p>'
            ],
            'pt' => [
                'subject' => 'Devolução de compra - {return_number}',
                'content' => '<p>Olá {vendor_name},</p><p>Uma devolução de compra foi criada para seu pedido.</p><p><strong>Detalhes da devolução:</strong></p><ul><li>Número da devolução: {return_number}</li><li>Compra original: {purchase_number}</li><li>Fornecedor: {vendor_name}</li><li>Data da devolução: {return_date}</li><li>Valor da devolução: {total_amount}</li><li>Motivo: {reason}</li><li>Data de criação: {created_date}</li></ul><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'pt-BR' => [
                'subject' => 'Devolução de compra - {return_number}',
                'content' => '<p>Olá {vendor_name},</p><p>Uma devolução de compra foi criada para seu pedido.</p><p><strong>Detalhes da devolução:</strong></p><ul><li>Número da devolução: {return_number}</li><li>Compra original: {purchase_number}</li><li>Fornecedor: {vendor_name}</li><li>Data da devolução: {return_date}</li><li>Valor da devolução: {total_amount}</li><li>Motivo: {reason}</li><li>Data de criação: {created_date}</li></ul><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'ru' => [
                'subject' => 'Возврат покупки - {return_number}',
                'content' => '<p>Привет {vendor_name},</p><p>Создан возврат покупки для вашего заказа.</p><p><strong>Детали возврата:</strong></p><ul><li>Номер возврата: {return_number}</li><li>Оригинальная покупка: {purchase_number}</li><li>Поставщик: {vendor_name}</li><li>Дата возврата: {return_date}</li><li>Сумма возврата: {total_amount}</li><li>Причина: {reason}</li><li>Дата создания: {created_date}</li></ul><p style="text-align: right;">С наилучшими пожеланиями,<br>{company_name}</p>'
            ],
            'tr' => [
                'subject' => 'Satın alma iadesi - {return_number}',
                'content' => '<p>Merhaba {vendor_name},</p><p>Siparişiniz için bir satın alma iadesi oluşturuldu.</p><p><strong>İade detayları:</strong></p><ul><li>İade numarası: {return_number}</li><li>Orijinal satın alma: {purchase_number}</li><li>Tedarikçi: {vendor_name}</li><li>İade tarihi: {return_date}</li><li>İade tutarı: {total_amount}</li><li>Sebep: {reason}</li><li>Oluşturulma tarihi: {created_date}</li></ul><p style="text-align: right;">Saygılarımızla,<br>{company_name}</p>'
            ],
            'zh' => [
                'subject' => '采购退货 - {return_number}',
                'content' => '<p>您好 {vendor_name}，</p><p>已为您的订单创建了采购退货。</p><p><strong>退货详情：</strong></p><ul><li>退货编号：{return_number}</li><li>原始采购：{purchase_number}</li><li>供应商：{vendor_name}</li><li>退货日期：{return_date}</li><li>退货金额：{total_amount}</li><li>原因：{reason}</li><li>创建日期：{created_date}</li></ul><p style="text-align: right;">此致敬礼，<br>{company_name}</p>'
            ]
        ];
    }

    public function getNewQuotationTranslations(): array
    {
        return [
            'en' => [
                'subject' => 'New Quotation - {quotation_number}',
                'content' => '<p>Hello {customer_name},</p><p>A new quotation has been created for you.</p><p><strong>Quotation Details:</strong></p><ul><li>Quotation Number: {quotation_number}</li><li>Customer: {customer_name}</li><li>Quotation Date: {quotation_date}</li><li>Valid Until: {valid_until}</li><li>Total Amount: {total_amount}</li><li>Created Date: {created_date}</li></ul><p style="text-align: right;">Best regards,<br>{company_name}</p>'
            ],
            'es' => [
                'subject' => 'Nueva Cotización - {quotation_number}',
                'content' => '<p>Hola {customer_name},</p><p>Se ha creado una nueva cotización para usted.</p><p><strong>Detalles de la Cotización:</strong></p><ul><li>Número de Cotización: {quotation_number}</li><li>Cliente: {customer_name}</li><li>Fecha de Cotización: {quotation_date}</li><li>Válida Hasta: {valid_until}</li><li>Monto Total: {total_amount}</li><li>Fecha de Creación: {created_date}</li></ul><p style="text-align: right;">Saludos cordiales,<br>{company_name}</p>'
            ],
            'ar' => [
                'subject' => 'عرض أسعار جديد - {quotation_number}',
                'content' => '<p>مرحباً {customer_name}،</p><p>تم إنشاء عرض أسعار جديد لك.</p><p><strong>تفاصيل عرض الأسعار:</strong></p><ul><li>رقم عرض الأسعار: {quotation_number}</li><li>العميل: {customer_name}</li><li>تاريخ عرض الأسعار: {quotation_date}</li><li>صالح حتى: {valid_until}</li><li>المبلغ الإجمالي: {total_amount}</li><li>تاريخ الإنشاء: {created_date}</li></ul><p style="text-align: right;">مع أطيب التحيات،<br>{company_name}</p>'
            ],
            'da' => [
                'subject' => 'Nyt tilbud - {quotation_number}',
                'content' => '<p>Hej {customer_name},</p><p>Et nyt tilbud er blevet oprettet til dig.</p><p><strong>Tilbudsdetaljer:</strong></p><ul><li>Tilbudsnummer: {quotation_number}</li><li>Kunde: {customer_name}</li><li>Tilbudsdato: {quotation_date}</li><li>Gyldigt indtil: {valid_until}</li><li>Samlet beløb: {total_amount}</li><li>Oprettelsesdato: {created_date}</li></ul><p style="text-align: right;">Med venlig hilsen,<br>{company_name}</p>'
            ],
            'de' => [
                'subject' => 'Neues Angebot - {quotation_number}',
                'content' => '<p>Hallo {customer_name},</p><p>Ein neues Angebot wurde für Sie erstellt.</p><p><strong>Angebotsdetails:</strong></p><ul><li>Angebotsnummer: {quotation_number}</li><li>Kunde: {customer_name}</li><li>Angebotsdatum: {quotation_date}</li><li>Gültig bis: {valid_until}</li><li>Gesamtbetrag: {total_amount}</li><li>Erstellungsdatum: {created_date}</li></ul><p style="text-align: right;">Mit freundlichen Grüßen,<br>{company_name}</p>'
            ],
            'fr' => [
                'subject' => 'Nouveau devis - {quotation_number}',
                'content' => '<p>Bonjour {customer_name},</p><p>Un nouveau devis a été créé pour vous.</p><p><strong>Détails du devis:</strong></p><ul><li>Numéro de devis: {quotation_number}</li><li>Client: {customer_name}</li><li>Date du devis: {quotation_date}</li><li>Valide jusqu\'au: {valid_until}</li><li>Montant total: {total_amount}</li><li>Date de création: {created_date}</li></ul><p style="text-align: right;">Cordialement,<br>{company_name}</p>'
            ],
            'he' => [
                'subject' => 'הצעת מחיר חדשה - {quotation_number}',
                'content' => '<p>שלום {customer_name},</p><p>הצעת מחיר חדשה נוצרה עבורך.</p><p><strong>פרטי הצעת המחיר:</strong></p><ul><li>מספר הצעת מחיר: {quotation_number}</li><li>לקוח: {customer_name}</li><li>תאריך הצעת מחיר: {quotation_date}</li><li>תקף עד: {valid_until}</li><li>סכום כולל: {total_amount}</li><li>תאריך יצירה: {created_date}</li></ul><p style="text-align: right;">בברכה,<br>{company_name}</p>'
            ],
            'it' => [
                'subject' => 'Nuovo preventivo - {quotation_number}',
                'content' => '<p>Ciao {customer_name},</p><p>È stato creato un nuovo preventivo per te.</p><p><strong>Dettagli del preventivo:</strong></p><ul><li>Numero preventivo: {quotation_number}</li><li>Cliente: {customer_name}</li><li>Data preventivo: {quotation_date}</li><li>Valido fino al: {valid_until}</li><li>Importo totale: {total_amount}</li><li>Data di creazione: {created_date}</li></ul><p style="text-align: right;">Cordiali saluti,<br>{company_name}</p>'
            ],
            'ja' => [
                'subject' => '新しい見積もり - {quotation_number}',
                'content' => '<p>こんにちは {customer_name}さん、</p><p>新しい見積もりが作成されました。</p><p><strong>見積もり詳細:</strong></p><ul><li>見積もり番号: {quotation_number}</li><li>お客様: {customer_name}</li><li>見積もり日: {quotation_date}</li><li>有効期限: {valid_until}</li><li>合計金額: {total_amount}</li><li>作成日: {created_date}</li></ul><p style="text-align: right;">よろしくお願いします、<br>{company_name}</p>'
            ],
            'nl' => [
                'subject' => 'Nieuwe offerte - {quotation_number}',
                'content' => '<p>Hallo {customer_name},</p><p>Een nieuwe offerte is voor je aangemaakt.</p><p><strong>Offerte details:</strong></p><ul><li>Offertenummer: {quotation_number}</li><li>Klant: {customer_name}</li><li>Offertedatum: {quotation_date}</li><li>Geldig tot: {valid_until}</li><li>Totaalbedrag: {total_amount}</li><li>Aanmaakdatum: {created_date}</li></ul><p style="text-align: right;">Met vriendelijke groet,<br>{company_name}</p>'
            ],
            'pl' => [
                'subject' => 'Nowa oferta - {quotation_number}',
                'content' => '<p>Cześć {customer_name},</p><p>Została utworzona nowa oferta dla Ciebie.</p><p><strong>Szczegóły oferty:</strong></p><ul><li>Numer oferty: {quotation_number}</li><li>Klient: {customer_name}</li><li>Data oferty: {quotation_date}</li><li>Ważna do: {valid_until}</li><li>Łączna kwota: {total_amount}</li><li>Data utworzenia: {created_date}</li></ul><p style="text-align: right;">Z poważaniem,<br>{company_name}</p>'
            ],
            'pt' => [
                'subject' => 'Nova cotação - {quotation_number}',
                'content' => '<p>Olá {customer_name},</p><p>Uma nova cotação foi criada para você.</p><p><strong>Detalhes da cotação:</strong></p><ul><li>Número da cotação: {quotation_number}</li><li>Cliente: {customer_name}</li><li>Data da cotação: {quotation_date}</li><li>Válida até: {valid_until}</li><li>Valor total: {total_amount}</li><li>Data de criação: {created_date}</li></ul><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'pt-BR' => [
                'subject' => 'Nova cotação - {quotation_number}',
                'content' => '<p>Olá {customer_name},</p><p>Uma nova cotação foi criada para você.</p><p><strong>Detalhes da cotação:</strong></p><ul><li>Número da cotação: {quotation_number}</li><li>Cliente: {customer_name}</li><li>Data da cotação: {quotation_date}</li><li>Válida até: {valid_until}</li><li>Valor total: {total_amount}</li><li>Data de criação: {created_date}</li></ul><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'ru' => [
                'subject' => 'Новое предложение - {quotation_number}',
                'content' => '<p>Привет {customer_name},</p><p>Для вас создано новое предложение.</p><p><strong>Детали предложения:</strong></p><ul><li>Номер предложения: {quotation_number}</li><li>Клиент: {customer_name}</li><li>Дата предложения: {quotation_date}</li><li>Действительно до: {valid_until}</li><li>Общая сумма: {total_amount}</li><li>Дата создания: {created_date}</li></ul><p style="text-align: right;">С наилучшими пожеланиями,<br>{company_name}</p>'
            ],
            'tr' => [
                'subject' => 'Yeni teklif - {quotation_number}',
                'content' => '<p>Merhaba {customer_name},</p><p>Sizin için yeni bir teklif oluşturuldu.</p><p><strong>Teklif detayları:</strong></p><ul><li>Teklif numarası: {quotation_number}</li><li>Müşteri: {customer_name}</li><li>Teklif tarihi: {quotation_date}</li><li>Geçerlilik tarihi: {valid_until}</li><li>Toplam tutar: {total_amount}</li><li>Oluşturulma tarihi: {created_date}</li></ul><p style="text-align: right;">Saygılarımızla,<br>{company_name}</p>'
            ],
            'zh' => [
                'subject' => '新报价单 - {quotation_number}',
                'content' => '<p>您好 {customer_name}，</p><p>已为您创建了新的报价单。</p><p><strong>报价单详情：</strong></p><ul><li>报价单编号：{quotation_number}</li><li>客户：{customer_name}</li><li>报价日期：{quotation_date}</li><li>有效期至：{valid_until}</li><li>总金额：{total_amount}</li><li>创建日期：{created_date}</li></ul><p style="text-align: right;">此致敬礼，<br>{company_name}</p>'
            ]
        ];
    }
    public function getSendQuotationTranslations(): array
    {
        return [
            'en' => [
                'subject' => 'Quotation Sent - {quotation_number}',
                'content' => '<p>Hello {customer_name},</p><p>Your quotation has been sent successfully.</p><p><strong>Quotation Details:</strong></p><ul><li>Quotation Number: {quotation_number}</li><li>Customer: {customer_name}</li><li>Quotation Date: {quotation_date}</li><li>Valid Until: {valid_until}</li><li>Total Amount: {total_amount}</li><li>Sent Date: {sent_date}</li></ul><p style="text-align: right;">Best regards,<br>{company_name}</p>'
            ],
            'es' => [
                'subject' => 'Cotización Enviada - {quotation_number}',
                'content' => '<p>Hola {customer_name},</p><p>Su cotización ha sido enviada correctamente.</p><p><strong>Detalles de la Cotización:</strong></p><ul><li>Número de Cotización: {quotation_number}</li><li>Cliente: {customer_name}</li><li>Fecha de Cotización: {quotation_date}</li><li>Válida Hasta: {valid_until}</li><li>Monto Total: {total_amount}</li><li>Fecha de Envío: {sent_date}</li></ul><p style="text-align: right;">Saludos cordiales,<br>{company_name}</p>'
            ],
            'ar' => [
                'subject' => 'تم إرسال عرض السعر - {quotation_number}',
                'content' => '<p>مرحباً {customer_name}،</p><p>تم إرسال عرض السعر الخاص بك بنجاح.</p><p><strong>تفاصيل عرض السعر:</strong></p><ul><li>رقم عرض السعر: {quotation_number}</li><li>العميل: {customer_name}</li><li>تاريخ عرض السعر: {quotation_date}</li><li>صالح حتى: {valid_until}</li><li>المبلغ الإجمالي: {total_amount}</li><li>تاريخ الإرسال: {sent_date}</li></ul><p style="text-align: right;">مع أطيب التحيات،<br>{company_name}</p>'
            ],
            'da' => [
                'subject' => 'Tilbud sendt - {quotation_number}',
                'content' => '<p>Hej {customer_name},</p><p>Dit tilbud er sendt.</p><p><strong>Tilbudsdetaljer:</strong></p><ul><li>Tilbudsnummer: {quotation_number}</li><li>Kunde: {customer_name}</li><li>Tilbudsdato: {quotation_date}</li><li>Gyldigt indtil: {valid_until}</li><li>Samlet beløb: {total_amount}</li><li>Sendt dato: {sent_date}</li></ul><p style="text-align: right;">Med venlig hilsen,<br>{company_name}</p>'
            ],
            'de' => [
                'subject' => 'Angebot gesendet - {quotation_number}',
                'content' => '<p>Hallo {customer_name},</p><p>Ihr Angebot wurde erfolgreich gesendet.</p><p><strong>Angebotsdetails:</strong></p><ul><li>Angebotsnummer: {quotation_number}</li><li>Kunde: {customer_name}</li><li>Angebotsdatum: {quotation_date}</li><li>Gültig bis: {valid_until}</li><li>Gesamtbetrag: {total_amount}</li><li>Sendedatum: {sent_date}</li></ul><p style="text-align: right;">Mit freundlichen Grüßen,<br>{company_name}</p>'
            ],
            'fr' => [
                'subject' => 'Devis envoyé - {quotation_number}',
                'content' => '<p>Bonjour {customer_name},</p><p>Votre devis a été envoyé avec succès.</p><p><strong>Détails du devis:</strong></p><ul><li>Numéro de devis: {quotation_number}</li><li>Client: {customer_name}</li><li>Date du devis: {quotation_date}</li><li>Valide jusqu\'au: {valid_until}</li><li>Montant total: {total_amount}</li><li>Date d\'envoi: {sent_date}</li></ul><p style="text-align: right;">Cordialement,<br>{company_name}</p>'
            ],
            'he' => [
                'subject' => 'הצעת מחיר נשלחה - {quotation_number}',
                'content' => '<p>שלום {customer_name},</p><p>הצעת המחיר שלך נשלחה בהצלחה.</p><p><strong>פרטי הצעת המחיר:</strong></p><ul><li>מספר הצעת מחיר: {quotation_number}</li><li>לקוח: {customer_name}</li><li>תאריך הצעה: {quotation_date}</li><li>תקף עד: {valid_until}</li><li>סכום כולל: {total_amount}</li><li>תאריך שליחה: {sent_date}</li></ul><p style="text-align: right;">בברכה,<br>{company_name}</p>'
            ],
            'it' => [
                'subject' => 'Preventivo Inviato - {quotation_number}',
                'content' => '<p>Ciao {customer_name},</p><p>Il tuo preventivo è stato inviato con successo.</p><p><strong>Dettagli del preventivo:</strong></p><ul><li>Numero preventivo: {quotation_number}</li><li>Cliente: {customer_name}</li><li>Data preventivo: {quotation_date}</li><li>Valido fino al: {valid_until}</li><li>Importo totale: {total_amount}</li><li>Data di invio: {sent_date}</li></ul><p style="text-align: right;">Cordiali saluti,<br>{company_name}</p>'
            ],
            'ja' => [
                'subject' => '見積書送付済み - {quotation_number}',
                'content' => '<p>こんにちは {customer_name}さん、</p><p>見積書が正常に送付されました。</p><p><strong>見積もり詳細:</strong></p><ul><li>見積もり番号: {quotation_number}</li><li>お客様: {customer_name}</li><li>見積もり日: {quotation_date}</li><li>有効期限: {valid_until}</li><li>合計金額: {total_amount}</li><li>送付日: {sent_date}</li></ul><p style="text-align: right;">よろしくお願いします、<br>{company_name}</p>'
            ],
            'nl' => [
                'subject' => 'Offerte Verzonden - {quotation_number}',
                'content' => '<p>Hallo {customer_name},</p><p>Je offerte is verzonden.</p><p><strong>Offertedetails:</strong></p><ul><li>Offertenummer: {quotation_number}</li><li>Klant: {customer_name}</li><li>Offertedatum: {quotation_date}</li><li>Geldig tot: {valid_until}</li><li>Totaalbedrag: {total_amount}</li><li>Verzenddatum: {sent_date}</li></ul><p style="text-align: right;">Met vriendelijke groet,<br>{company_name}</p>'
            ],
            'pl' => [
                'subject' => 'Oferta wysłana - {quotation_number}',
                'content' => '<p>Cześć {customer_name},</p><p>Twoja oferta została wysłana.</p><p><strong>Szczegóły oferty:</strong></p><ul><li>Numer oferty: {quotation_number}</li><li>Klient: {customer_name}</li><li>Data oferty: {quotation_date}</li><li>Ważna do: {valid_until}</li><li>Łączna kwota: {total_amount}</li><li>Data wysłania: {sent_date}</li></ul><p style="text-align: right;">Z poważaniem,<br>{company_name}</p>'
            ],
            'pt' => [
                'subject' => 'Cotação Enviada - {quotation_number}',
                'content' => '<p>Olá {customer_name},</p><p>Sua cotação foi enviada com sucesso.</p><p><strong>Detalhes da cotação:</strong></p><ul><li>Número da cotação: {quotation_number}</li><li>Cliente: {customer_name}</li><li>Data da cotação: {quotation_date}</li><li>Válida até: {valid_until}</li><li>Valor total: {total_amount}</li><li>Data de envio: {sent_date}</li></ul><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'pt-BR' => [
                'subject' => 'Cotação Enviada - {quotation_number}',
                'content' => '<p>Olá {customer_name},</p><p>Sua cotação foi enviada com sucesso.</p><p><strong>Detalhes da cotação:</strong></p><ul><li>Número da cotação: {quotation_number}</li><li>Cliente: {customer_name}</li><li>Data da cotação: {quotation_date}</li><li>Válida até: {valid_until}</li><li>Valor total: {total_amount}</li><li>Data de envio: {sent_date}</li></ul><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'ru' => [
                'subject' => 'Предложение отправлено - {quotation_number}',
                'content' => '<p>Здравствуйте {customer_name},</p><p>Ваше предложение успешно отправлено.</p><p><strong>Детали предложения:</strong></p><ul><li>Номер предложения: {quotation_number}</li><li>Клиент: {customer_name}</li><li>Дата предложения: {quotation_date}</li><li>Действительно до: {valid_until}</li><li>Общая сумма: {total_amount}</li><li>Дата отправки: {sent_date}</li></ul><p style="text-align: right;">С уважением,<br>{company_name}</p>'
            ],
            'tr' => [
                'subject' => 'Teklif Gönderildi - {quotation_number}',
                'content' => '<p>Merhaba {customer_name},</p><p>Teklifiniz başarıyla gönderildi.</p><p><strong>Teklif Detayları:</strong></p><ul><li>Teklif Numarası: {quotation_number}</li><li>Müşteri: {customer_name}</li><li>Teklif Tarihi: {quotation_date}</li><li>Geçerlilik Tarihi: {valid_until}</li><li>Toplam Tutar: {total_amount}</li><li>Gönderim Tarihi: {sent_date}</li></ul><p style="text-align: right;">Saygılarımızla,<br>{company_name}</p>'
            ],
            'zh' => [
                'subject' => '报价单已发送 - {quotation_number}',
                'content' => '<p>您好 {customer_name}，</p><p>您的报价单已成功发送。</p><p><strong>报价单详情：</strong></p><ul><li>报价单编号：{quotation_number}</li><li>客户：{customer_name}</li><li>报价日期：{quotation_date}</li><li>有效期至：{valid_until}</li><li>总金额：{total_amount}</li><li>发送日期：{sent_date}</li></ul><p style="text-align: right;">此致敬礼，<br>{company_name}</p>'
            ]
        ];
    }

    public function getNewSaleReturnTranslations(): array
    {
        return [
            'en' => [
                'subject' => 'Sale Return - {return_number}',
                'content' => '<p>Hello {customer_name},</p><p>A sale return has been created for your order.</p><p><strong>Return Details:</strong></p><ul><li>Return Number: {return_number}</li><li>Original Sale: {sale_number}</li><li>Customer: {customer_name}</li><li>Return Date: {return_date}</li><li>Return Amount: {total_amount}</li><li>Reason: {reason}</li><li>Created Date: {created_date}</li></ul><p style="text-align: right;">Best regards,<br>{company_name}</p>'
            ],
            'es' => [
                'subject' => 'Devolución de Venta - {return_number}',
                'content' => '<p>Hola {customer_name},</p><p>Se ha creado una devolución de venta para su pedido.</p><p><strong>Detalles de la Devolución:</strong></p><ul><li>Número de Devolución: {return_number}</li><li>Venta Original: {sale_number}</li><li>Cliente: {customer_name}</li><li>Fecha de Devolución: {return_date}</li><li>Monto de Devolución: {total_amount}</li><li>Razón: {reason}</li><li>Fecha de Creación: {created_date}</li></ul><p style="text-align: right;">Saludos cordiales,<br>{company_name}</p>'
            ],
            'ar' => [
                'subject' => 'إرجاع بيع - {return_number}',
                'content' => '<p>مرحباً {customer_name}،</p><p>تم إنشاء إرجاع بيع لطلبك.</p><p><strong>تفاصيل الإرجاع:</strong></p><ul><li>رقم الإرجاع: {return_number}</li><li>البيع الأصلي: {sale_number}</li><li>العميل: {customer_name}</li><li>تاريخ الإرجاع: {return_date}</li><li>مبلغ الإرجاع: {total_amount}</li><li>السبب: {reason}</li><li>تاريخ الإنشاء: {created_date}</li></ul><p style="text-align: right;">مع أطيب التحيات،<br>{company_name}</p>'
            ],
            'da' => [
                'subject' => 'Salgsretur - {return_number}',
                'content' => '<p>Hej {customer_name},</p><p>En salgsretur er blevet oprettet for din ordre.</p><p><strong>Returdetaljer:</strong></p><ul><li>Returnummer: {return_number}</li><li>Oprindeligt salg: {sale_number}</li><li>Kunde: {customer_name}</li><li>Returdato: {return_date}</li><li>Returbeløb: {total_amount}</li><li>Årsag: {reason}</li><li>Oprettelsesdato: {created_date}</li></ul><p style="text-align: right;">Med venlig hilsen,<br>{company_name}</p>'
            ],
            'de' => [
                'subject' => 'Verkaufsrückgabe - {return_number}',
                'content' => '<p>Hallo {customer_name},</p><p>Eine Verkaufsrückgabe wurde für Ihre Bestellung erstellt.</p><p><strong>Rückgabedetails:</strong></p><ul><li>Rückgabenummer: {return_number}</li><li>Ursprünglicher Verkauf: {sale_number}</li><li>Kunde: {customer_name}</li><li>Rückgabedatum: {return_date}</li><li>Rückgabebetrag: {total_amount}</li><li>Grund: {reason}</li><li>Erstellungsdatum: {created_date}</li></ul><p style="text-align: right;">Mit freundlichen Grüßen,<br>{company_name}</p>'
            ],
            'fr' => [
                'subject' => 'Retour de vente - {return_number}',
                'content' => '<p>Bonjour {customer_name},</p><p>Un retour de vente a été créé pour votre commande.</p><p><strong>Détails du retour:</strong></p><ul><li>Numéro de retour: {return_number}</li><li>Vente originale: {sale_number}</li><li>Client: {customer_name}</li><li>Date de retour: {return_date}</li><li>Montant du retour: {total_amount}</li><li>Raison: {reason}</li><li>Date de création: {created_date}</li></ul><p style="text-align: right;">Cordialement,<br>{company_name}</p>'
            ],
            'he' => [
                'subject' => 'החזרת מכירה - {return_number}',
                'content' => '<p>שלום {customer_name},</p><p>החזרת מכירה נוצרה עבור הזמנתך.</p><p><strong>פרטי החזרה:</strong></p><ul><li>מספר החזרה: {return_number}</li><li>מכירה מקורית: {sale_number}</li><li>לקוח: {customer_name}</li><li>תאריך החזרה: {return_date}</li><li>סכום החזרה: {total_amount}</li><li>סיבה: {reason}</li><li>תאריך יצירה: {created_date}</li></ul><p style="text-align: right;">בברכה,<br>{company_name}</p>'
            ],
            'it' => [
                'subject' => 'Reso vendita - {return_number}',
                'content' => '<p>Ciao {customer_name},</p><p>È stato creato un reso vendita per il tuo ordine.</p><p><strong>Dettagli del reso:</strong></p><ul><li>Numero reso: {return_number}</li><li>Vendita originale: {sale_number}</li><li>Cliente: {customer_name}</li><li>Data reso: {return_date}</li><li>Importo reso: {total_amount}</li><li>Motivo: {reason}</li><li>Data di creazione: {created_date}</li></ul><p style="text-align: right;">Cordiali saluti,<br>{company_name}</p>'
            ],
            'ja' => [
                'subject' => '販売返品 - {return_number}',
                'content' => '<p>こんにちは {customer_name}さん、</p><p>ご注文の販売返品が作成されました。</p><p><strong>返品詳細:</strong></p><ul><li>返品番号: {return_number}</li><li>元の販売: {sale_number}</li><li>お客様: {customer_name}</li><li>返品日: {return_date}</li><li>返品金額: {total_amount}</li><li>理由: {reason}</li><li>作成日: {created_date}</li></ul><p style="text-align: right;">よろしくお願いします、<br>{company_name}</p>'
            ],
            'nl' => [
                'subject' => 'Verkoopretour - {return_number}',
                'content' => '<p>Hallo {customer_name},</p><p>Een verkoopretour is aangemaakt voor je bestelling.</p><p><strong>Retourdetails:</strong></p><ul><li>Retournummer: {return_number}</li><li>Oorspronkelijke verkoop: {sale_number}</li><li>Klant: {customer_name}</li><li>Retourdatum: {return_date}</li><li>Retourbedrag: {total_amount}</li><li>Reden: {reason}</li><li>Aanmaakdatum: {created_date}</li></ul><p style="text-align: right;">Met vriendelijke groet,<br>{company_name}</p>'
            ],
            'pl' => [
                'subject' => 'Zwrot sprzedaży - {return_number}',
                'content' => '<p>Cześć {customer_name},</p><p>Został utworzony zwrot sprzedaży dla Twojego zamówienia.</p><p><strong>Szczegóły zwrotu:</strong></p><ul><li>Numer zwrotu: {return_number}</li><li>Oryginalna sprzedaż: {sale_number}</li><li>Klient: {customer_name}</li><li>Data zwrotu: {return_date}</li><li>Kwota zwrotu: {total_amount}</li><li>Powód: {reason}</li><li>Data utworzenia: {created_date}</li></ul><p style="text-align: right;">Z poważaniem,<br>{company_name}</p>'
            ],
            'pt' => [
                'subject' => 'Devolução de venda - {return_number}',
                'content' => '<p>Olá {customer_name},</p><p>Uma devolução de venda foi criada para seu pedido.</p><p><strong>Detalhes da devolução:</strong></p><ul><li>Número da devolução: {return_number}</li><li>Venda original: {sale_number}</li><li>Cliente: {customer_name}</li><li>Data da devolução: {return_date}</li><li>Valor da devolução: {total_amount}</li><li>Motivo: {reason}</li><li>Data de criação: {created_date}</li></ul><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'pt-BR' => [
                'subject' => 'Devolução de venda - {return_number}',
                'content' => '<p>Olá {customer_name},</p><p>Uma devolução de venda foi criada para seu pedido.</p><p><strong>Detalhes da devolução:</strong></p><ul><li>Número da devolução: {return_number}</li><li>Venda original: {sale_number}</li><li>Cliente: {customer_name}</li><li>Data da devolução: {return_date}</li><li>Valor da devolução: {total_amount}</li><li>Motivo: {reason}</li><li>Data de criação: {created_date}</li></ul><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'ru' => [
                'subject' => 'Возврат продажи - {return_number}',
                'content' => '<p>Привет {customer_name},</p><p>Создан возврат продажи для вашего заказа.</p><p><strong>Детали возврата:</strong></p><ul><li>Номер возврата: {return_number}</li><li>Оригинальная продажа: {sale_number}</li><li>Клиент: {customer_name}</li><li>Дата возврата: {return_date}</li><li>Сумма возврата: {total_amount}</li><li>Причина: {reason}</li><li>Дата создания: {created_date}</li></ul><p style="text-align: right;">С наилучшими пожеланиями,<br>{company_name}</p>'
            ],
            'tr' => [
                'subject' => 'Satış iadesi - {return_number}',
                'content' => '<p>Merhaba {customer_name},</p><p>Siparişiniz için bir satış iadesi oluşturuldu.</p><p><strong>İade detayları:</strong></p><ul><li>İade numarası: {return_number}</li><li>Orijinal satış: {sale_number}</li><li>Müşteri: {customer_name}</li><li>İade tarihi: {return_date}</li><li>İade tutarı: {total_amount}</li><li>Sebep: {reason}</li><li>Oluşturulma tarihi: {created_date}</li></ul><p style="text-align: right;">Saygılarımızla,<br>{company_name}</p>'
            ],
            'zh' => [
                'subject' => '销售退货 - {return_number}',
                'content' => '<p>您好 {customer_name}，</p><p>已为您的订单创建了销售退货。</p><p><strong>退货详情：</strong></p><ul><li>退货编号：{return_number}</li><li>原始销售：{sale_number}</li><li>客户：{customer_name}</li><li>退货日期：{return_date}</li><li>退货金额：{total_amount}</li><li>原因：{reason}</li><li>创建日期：{created_date}</li></ul><p style="text-align: right;">此致敬礼，<br>{company_name}</p>'
            ]
        ];
    }

    public function getNewExpenseTranslations(): array
    {
        return [
            'en' => [
                'subject' => 'New Expense - {expense_title}',
                'content' => '<p>Hello,</p><p>A new expense has been created.</p><p><strong>Expense Details:</strong></p><ul><li>Title: {expense_title}</li><li>Amount: {expense_amount}</li><li>Date: {expense_date}</li><li>Description: {expense_description}</li><li>Status: {expense_status}</li><li>Branch: {branch_name}</li><li>Category: {expense_category}</li><li>Created By: {created_by}</li></ul><p style="text-align: right;">Best regards,<br>{company_name}</p>'
            ],
            'es' => [
                'subject' => 'Nuevo Gasto - {expense_title}',
                'content' => '<p>Hola,</p><p>Se ha creado un nuevo gasto.</p><p><strong>Detalles del Gasto:</strong></p><ul><li>Título: {expense_title}</li><li>Monto: {expense_amount}</li><li>Fecha: {expense_date}</li><li>Descripción: {expense_description}</li><li>Estado: {expense_status}</li><li>Sucursal: {branch_name}</li><li>Categoría: {expense_category}</li><li>Creado por: {created_by}</li></ul><p style="text-align: right;">Saludos cordiales,<br>{company_name}</p>'
            ],
            'ar' => [
                'subject' => 'مصروف جديد - {expense_title}',
                'content' => '<p>مرحباً،</p><p>تم إنشاء مصروف جديد.</p><p><strong>تفاصيل المصروف:</strong></p><ul><li>العنوان: {expense_title}</li><li>المبلغ: {expense_amount}</li><li>التاريخ: {expense_date}</li><li>الوصف: {expense_description}</li><li>الحالة: {expense_status}</li><li>الفرع: {branch_name}</li><li>الفئة: {expense_category}</li><li>أنشأ بواسطة: {created_by}</li></ul><p style="text-align: right;">مع أطيب التحيات،<br>{company_name}</p>'
            ],
            'da' => [
                'subject' => 'Ny udgift - {expense_title}',
                'content' => '<p>Hej,</p><p>En ny udgift er blevet oprettet.</p><p><strong>Udgiftsdetaljer:</strong></p><ul><li>Titel: {expense_title}</li><li>Beløb: {expense_amount}</li><li>Dato: {expense_date}</li><li>Beskrivelse: {expense_description}</li><li>Status: {expense_status}</li><li>Filial: {branch_name}</li><li>Kategori: {expense_category}</li><li>Oprettet af: {created_by}</li></ul><p style="text-align: right;">Med venlig hilsen,<br>{company_name}</p>'
            ],
            'de' => [
                'subject' => 'Neue Ausgabe - {expense_title}',
                'content' => '<p>Hallo,</p><p>Eine neue Ausgabe wurde erstellt.</p><p><strong>Ausgabendetails:</strong></p><ul><li>Titel: {expense_title}</li><li>Betrag: {expense_amount}</li><li>Datum: {expense_date}</li><li>Beschreibung: {expense_description}</li><li>Status: {expense_status}</li><li>Filiale: {branch_name}</li><li>Kategorie: {expense_category}</li><li>Erstellt von: {created_by}</li></ul><p style="text-align: right;">Mit freundlichen Grüßen,<br>{company_name}</p>'
            ],
            'fr' => [
                'subject' => 'Nouvelle dépense - {expense_title}',
                'content' => '<p>Bonjour,</p><p>Une nouvelle dépense a été créée.</p><p><strong>Détails de la dépense:</strong></p><ul><li>Titre: {expense_title}</li><li>Montant: {expense_amount}</li><li>Date: {expense_date}</li><li>Description: {expense_description}</li><li>Statut: {expense_status}</li><li>Succursale: {branch_name}</li><li>Catégorie: {expense_category}</li><li>Créé par: {created_by}</li></ul><p style="text-align: right;">Cordialement,<br>{company_name}</p>'
            ],
            'he' => [
                'subject' => 'הוצאה חדשה - {expense_title}',
                'content' => '<p>שלום,</p><p>הוצאה חדשה נוצרה.</p><p><strong>פרטי ההוצאה:</strong></p><ul><li>כותרת: {expense_title}</li><li>סכום: {expense_amount}</li><li>תאריך: {expense_date}</li><li>תיאור: {expense_description}</li><li>סטטוס: {expense_status}</li><li>סניף: {branch_name}</li><li>קטגוריה: {expense_category}</li><li>נוצר על ידי: {created_by}</li></ul><p style="text-align: right;">בברכה,<br>{company_name}</p>'
            ],
            'it' => [
                'subject' => 'Nuova spesa - {expense_title}',
                'content' => '<p>Ciao,</p><p>È stata creata una nuova spesa.</p><p><strong>Dettagli della spesa:</strong></p><ul><li>Titolo: {expense_title}</li><li>Importo: {expense_amount}</li><li>Data: {expense_date}</li><li>Descrizione: {expense_description}</li><li>Stato: {expense_status}</li><li>Filiale: {branch_name}</li><li>Categoria: {expense_category}</li><li>Creato da: {created_by}</li></ul><p style="text-align: right;">Cordiali saluti,<br>{company_name}</p>'
            ],
            'ja' => [
                'subject' => '新しい経費 - {expense_title}',
                'content' => '<p>こんにちは、</p><p>新しい経費が作成されました。</p><p><strong>経費詳細:</strong></p><ul><li>タイトル: {expense_title}</li><li>金額: {expense_amount}</li><li>日付: {expense_date}</li><li>説明: {expense_description}</li><li>ステータス: {expense_status}</li><li>支店: {branch_name}</li><li>カテゴリ: {expense_category}</li><li>作成者: {created_by}</li></ul><p style="text-align: right;">よろしくお願いします、<br>{company_name}</p>'
            ],
            'nl' => [
                'subject' => 'Nieuwe uitgave - {expense_title}',
                'content' => '<p>Hallo,</p><p>Een nieuwe uitgave is aangemaakt.</p><p><strong>Uitgave details:</strong></p><ul><li>Titel: {expense_title}</li><li>Bedrag: {expense_amount}</li><li>Datum: {expense_date}</li><li>Beschrijving: {expense_description}</li><li>Status: {expense_status}</li><li>Vestiging: {branch_name}</li><li>Categorie: {expense_category}</li><li>Aangemaakt door: {created_by}</li></ul><p style="text-align: right;">Met vriendelijke groet,<br>{company_name}</p>'
            ],
            'pl' => [
                'subject' => 'Nowy wydatek - {expense_title}',
                'content' => '<p>Cześć,</p><p>Został utworzony nowy wydatek.</p><p><strong>Szczegóły wydatku:</strong></p><ul><li>Tytuł: {expense_title}</li><li>Kwota: {expense_amount}</li><li>Data: {expense_date}</li><li>Opis: {expense_description}</li><li>Status: {expense_status}</li><li>Oddział: {branch_name}</li><li>Kategoria: {expense_category}</li><li>Utworzony przez: {created_by}</li></ul><p style="text-align: right;">Z poważaniem,<br>{company_name}</p>'
            ],
            'pt' => [
                'subject' => 'Nova despesa - {expense_title}',
                'content' => '<p>Olá,</p><p>Uma nova despesa foi criada.</p><p><strong>Detalhes da despesa:</strong></p><ul><li>Título: {expense_title}</li><li>Valor: {expense_amount}</li><li>Data: {expense_date}</li><li>Descrição: {expense_description}</li><li>Status: {expense_status}</li><li>Filial: {branch_name}</li><li>Categoria: {expense_category}</li><li>Criado por: {created_by}</li></ul><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'pt-BR' => [
                'subject' => 'Nova despesa - {expense_title}',
                'content' => '<p>Olá,</p><p>Uma nova despesa foi criada.</p><p><strong>Detalhes da despesa:</strong></p><ul><li>Título: {expense_title}</li><li>Valor: {expense_amount}</li><li>Data: {expense_date}</li><li>Descrição: {expense_description}</li><li>Status: {expense_status}</li><li>Filial: {branch_name}</li><li>Categoria: {expense_category}</li><li>Criado por: {created_by}</li></ul><p style="text-align: right;">Atenciosamente,<br>{company_name}</p>'
            ],
            'ru' => [
                'subject' => 'Новый расход - {expense_title}',
                'content' => '<p>Привет,</p><p>Создан новый расход.</p><p><strong>Детали расхода:</strong></p><ul><li>Название: {expense_title}</li><li>Сумма: {expense_amount}</li><li>Дата: {expense_date}</li><li>Описание: {expense_description}</li><li>Статус: {expense_status}</li><li>Филиал: {branch_name}</li><li>Категория: {expense_category}</li><li>Создано: {created_by}</li></ul><p style="text-align: right;">С наилучшими пожеланиями,<br>{company_name}</p>'
            ],
            'tr' => [
                'subject' => 'Yeni gider - {expense_title}',
                'content' => '<p>Merhaba,</p><p>Yeni bir gider oluşturuldu.</p><p><strong>Gider detayları:</strong></p><ul><li>Başlık: {expense_title}</li><li>Tutar: {expense_amount}</li><li>Tarih: {expense_date}</li><li>Açıklama: {expense_description}</li><li>Durum: {expense_status}</li><li>Şube: {branch_name}</li><li>Kategori: {expense_category}</li><li>Oluşturan: {created_by}</li></ul><p style="text-align: right;">Saygılarımızla,<br>{company_name}</p>'
            ],
            'zh' => [
                'subject' => '新费用 - {expense_title}',
                'content' => '<p>您好，</p><p>已创建新费用。</p><p><strong>费用详情：</strong></p><ul><li>标题：{expense_title}</li><li>金额：{expense_amount}</li><li>日期：{expense_date}</li><li>描述：{expense_description}</li><li>状态：{expense_status}</li><li>分支机构：{branch_name}</li><li>类别：{expense_category}</li><li>创建者：{created_by}</li></ul><p style="text-align: right;">此致敬礼，<br>{company_name}</p>'
            ]
        ];
    }
}
