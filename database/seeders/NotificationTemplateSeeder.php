<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\NotificationTemplate;
use App\Models\NotificationTemplateLang;

class NotificationTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $languages = json_decode(file_get_contents(resource_path('lang/language.json')), true);
        $langCodes = collect($languages)->pluck('code')->toArray();

        $templates = [
            [
                'name' => 'New Customer',
                'types' => ['slack', 'twilio'],
                'translations' => [
                    'en' => [
                        'slack' => [
                            'title' => 'New Customer Added',
                            'content' => 'A new customer "{customer_name}" has been added to the system by {created_by}. Email: {customer_email}, Phone: {customer_phone}.'
                        ],
                        'twilio' => [
                            'title' => 'New Customer',
                            'content' => 'New customer {customer_name} added by {created_by}. Phone: {customer_phone}.'
                        ]
                    ],
                    'es' => [
                        'slack' => [
                            'title' => 'Nuevo cliente agregado',
                            'content' => 'Un nuevo cliente "{customer_name}" ha sido agregado al sistema por {created_by}. Correo: {customer_email}, Teléfono: {customer_phone}.'
                        ],
                        'twilio' => [
                            'title' => 'Nuevo cliente',
                            'content' => 'Nuevo cliente {customer_name} agregado por {created_by}. Teléfono: {customer_phone}.'
                        ]
                    ],
                    'ar' => [
                        'slack' => [
                            'title' => 'إضافة عميل جديد',
                            'content' => 'تمت إضافة عميل جديد "{customer_name}" إلى النظام بواسطة {created_by}. البريد: {customer_email}، الهاتف: {customer_phone}.'
                        ],
                        'twilio' => [
                            'title' => 'عميل جديد',
                            'content' => 'تمت إضافة العميل {customer_name} بواسطة {created_by}. الهاتف: {customer_phone}.'
                        ]
                    ],
                    'da' => [
                        'slack' => [
                            'title' => 'Ny kunde tilføjet',
                            'content' => 'En ny kunde "{customer_name}" er blevet tilføjet af {created_by}. Email: {customer_email}, Telefon: {customer_phone}.'
                        ],
                        'twilio' => [
                            'title' => 'Ny kunde',
                            'content' => 'Ny kunde {customer_name} tilføjet af {created_by}. Telefon: {customer_phone}.'
                        ]
                    ],
                    'de' => [
                        'slack' => [
                            'title' => 'Neuer Kunde hinzugefügt',
                            'content' => 'Ein neuer Kunde "{customer_name}" wurde von {created_by} hinzugefügt. E-Mail: {customer_email}, Telefon: {customer_phone}.'
                        ],
                        'twilio' => [
                            'title' => 'Neuer Kunde',
                            'content' => 'Neuer Kunde {customer_name} hinzugefügt von {created_by}. Telefon: {customer_phone}.'
                        ]
                    ],
                    'fr' => [
                        'slack' => [
                            'title' => 'Nouveau client ajouté',
                            'content' => 'Un nouveau client "{customer_name}" a été ajouté par {created_by}. Email : {customer_email}, Téléphone : {customer_phone}.'
                        ],
                        'twilio' => [
                            'title' => 'Nouveau client',
                            'content' => 'Nouveau client {customer_name} ajouté par {created_by}. Téléphone : {customer_phone}.'
                        ]
                    ],
                    'he' => [
                        'slack' => [
                            'title' => 'לקוח חדש נוסף',
                            'content' => 'לקוח חדש "{customer_name}" נוסף למערכת על ידי {created_by}. אימייל: {customer_email}, טלפון: {customer_phone}.'
                        ],
                        'twilio' => [
                            'title' => 'לקוח חדש',
                            'content' => 'לקוח חדש {customer_name} נוסף על ידי {created_by}. טלפון: {customer_phone}.'
                        ]
                    ],
                    'it' => [
                        'slack' => [
                            'title' => 'Nuovo cliente aggiunto',
                            'content' => 'Un nuovo cliente "{customer_name}" è stato aggiunto da {created_by}. Email: {customer_email}, Telefono: {customer_phone}.'
                        ],
                        'twilio' => [
                            'title' => 'Nuovo cliente',
                            'content' => 'Nuovo cliente {customer_name} aggiunto da {created_by}. Telefono: {customer_phone}.'
                        ]
                    ],
                    'ja' => [
                        'slack' => [
                            'title' => '新しい顧客が追加されました',
                            'content' => '新しい顧客「{customer_name}」が {created_by} により追加されました。メール: {customer_email}、電話: {customer_phone}。'
                        ],
                        'twilio' => [
                            'title' => '新規顧客',
                            'content' => '新規顧客 {customer_name} が {created_by} により追加されました。電話: {customer_phone}。'
                        ]
                    ],
                    'nl' => [
                        'slack' => [
                            'title' => 'Nieuwe klant toegevoegd',
                            'content' => 'Een nieuwe klant "{customer_name}" is toegevoegd door {created_by}. E-mail: {customer_email}, Telefoon: {customer_phone}.'
                        ],
                        'twilio' => [
                            'title' => 'Nieuwe klant',
                            'content' => 'Nieuwe klant {customer_name} toegevoegd door {created_by}. Telefoon: {customer_phone}.'
                        ]
                    ],
                    'pl' => [
                        'slack' => [
                            'title' => 'Dodano nowego klienta',
                            'content' => 'Nowy klient "{customer_name}" został dodany przez {created_by}. E-mail: {customer_email}, Telefon: {customer_phone}.'
                        ],
                        'twilio' => [
                            'title' => 'Nowy klient',
                            'content' => 'Nowy klient {customer_name} dodany przez {created_by}. Telefon: {customer_phone}.'
                        ]
                    ],
                    'pt' => [
                        'slack' => [
                            'title' => 'Novo cliente adicionado',
                            'content' => 'Um novo cliente "{customer_name}" foi adicionado por {created_by}. Email: {customer_email}, Telefone: {customer_phone}.'
                        ],
                        'twilio' => [
                            'title' => 'Novo cliente',
                            'content' => 'Novo cliente {customer_name} adicionado por {created_by}. Telefone: {customer_phone}.'
                        ]
                    ],
                    'pt-BR' => [
                        'slack' => [
                            'title' => 'Novo cliente adicionado',
                            'content' => 'Um novo cliente "{customer_name}" foi adicionado por {created_by}. Email: {customer_email}, Telefone: {customer_phone}.'
                        ],
                        'twilio' => [
                            'title' => 'Novo cliente',
                            'content' => 'Novo cliente {customer_name} adicionado por {created_by}. Telefone: {customer_phone}.'
                        ]
                    ],
                    'ru' => [
                        'slack' => [
                            'title' => 'Добавлен новый клиент',
                            'content' => 'Новый клиент "{customer_name}" был добавлен пользователем {created_by}. Email: {customer_email}, Телефон: {customer_phone}.'
                        ],
                        'twilio' => [
                            'title' => 'Новый клиент',
                            'content' => 'Новый клиент {customer_name} добавлен пользователем {created_by}. Телефон: {customer_phone}.'
                        ]
                    ],
                    'tr' => [
                        'slack' => [
                            'title' => 'Yeni müşteri eklendi',
                            'content' => 'Yeni müşteri "{customer_name}" {created_by} tarafından eklendi. E-posta: {customer_email}, Telefon: {customer_phone}.'
                        ],
                        'twilio' => [
                            'title' => 'Yeni Müşteri',
                            'content' => 'Yeni müşteri {customer_name}, {created_by} tarafından eklendi. Telefon: {customer_phone}.'
                        ]
                    ],
                    'zh' => [
                        'slack' => [
                            'title' => '新增客户',
                            'content' => '由 {created_by} 添加了新客户“{customer_name}”。邮箱：{customer_email}，电话：{customer_phone}。'
                        ],
                        'twilio' => [
                            'title' => '新客户',
                            'content' => '新客户 {customer_name} 已由 {created_by} 添加。电话：{customer_phone}。'
                        ]
                    ]
                ]
            ],

            [
                'name' => 'New Sale',
                'types' => ['slack', 'twilio'],
                'translations' => [
                    'en' => [
                        'slack' => [
                            'title' => 'New Sale Created',
                            'content' => 'A new sale #{sale_number} has been created for customer {customer_name}. Total Amount: {total_amount}. Created by: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'New Sale',
                            'content' => 'Sale #{sale_number} created. Total Amount: {total_amount}.'
                        ]
                    ],
                    'es' => [
                        'slack' => [
                            'title' => 'Nueva venta creada',
                            'content' => 'Se ha creado una nueva venta #{sale_number} para el cliente {customer_name}. Importe total: {total_amount}. Creado por: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nueva venta',
                            'content' => 'Venta #{sale_number} creada. Importe total: {total_amount}.'
                        ]
                    ],
                    'fr' => [
                        'slack' => [
                            'title' => 'Nouvelle vente créée',
                            'content' => 'Une nouvelle vente #{sale_number} a été créée pour le client {customer_name}. Montant total : {total_amount}. Créée par : {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nouvelle vente',
                            'content' => 'Vente #{sale_number} créée. Montant total : {total_amount}.'
                        ]
                    ],
                    'de' => [
                        'slack' => [
                            'title' => 'Neuer Verkauf erstellt',
                            'content' => 'Ein neuer Verkauf #{sale_number} wurde für den Kunden {customer_name} erstellt. Gesamtbetrag: {total_amount}. Erstellt von: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Neuer Verkauf',
                            'content' => 'Verkauf #{sale_number} erstellt. Gesamtbetrag: {total_amount}.'
                        ]
                    ],
                    'it' => [
                        'slack' => [
                            'title' => 'Nuova vendita creata',
                            'content' => 'È stata creata una nuova vendita #{sale_number} per il cliente {customer_name}. Importo totale: {total_amount}. Creato da: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nuova vendita',
                            'content' => 'Vendita #{sale_number} creata. Importo totale: {total_amount}.'
                        ]
                    ],
                    'pt' => [
                        'slack' => [
                            'title' => 'Nova venda criada',
                            'content' => 'Uma nova venda #{sale_number} foi criada para o cliente {customer_name}. Valor total: {total_amount}. Criado por: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nova venda',
                            'content' => 'Venda #{sale_number} criada. Valor total: {total_amount}.'
                        ]
                    ],
                    'pt-BR' => [
                        'slack' => [
                            'title' => 'Nova venda criada',
                            'content' => 'Uma nova venda #{sale_number} foi criada para o cliente {customer_name}. Valor total: {total_amount}. Criado por: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nova venda',
                            'content' => 'Venda #{sale_number} criada. Valor total: {total_amount}.'
                        ]
                    ],
                    'nl' => [
                        'slack' => [
                            'title' => 'Nieuwe verkoop aangemaakt',
                            'content' => 'Een nieuwe verkoop #{sale_number} is aangemaakt voor klant {customer_name}. Totaalbedrag: {total_amount}. Aangemaakt door: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nieuwe verkoop',
                            'content' => 'Verkoop #{sale_number} aangemaakt. Totaalbedrag: {total_amount}.'
                        ]
                    ],
                    'da' => [
                        'slack' => [
                            'title' => 'Nyt salg oprettet',
                            'content' => 'Et nyt salg #{sale_number} er oprettet for kunden {customer_name}. Samlet beløb: {total_amount}. Oprettet af: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nyt salg',
                            'content' => 'Salg #{sale_number} oprettet. Samlet beløb: {total_amount}.'
                        ]
                    ],
                    'pl' => [
                        'slack' => [
                            'title' => 'Nowa sprzedaż utworzona',
                            'content' => 'Nowa sprzedaż #{sale_number} została utworzona dla klienta {customer_name}. Łączna kwota: {total_amount}. Utworzone przez: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nowa sprzedaż',
                            'content' => 'Sprzedaż #{sale_number} utworzona. Łączna kwota: {total_amount}.'
                        ]
                    ],
                    'ru' => [
                        'slack' => [
                            'title' => 'Создана новая продажа',
                            'content' => 'Создана новая продажа #{sale_number} для клиента {customer_name}. Общая сумма: {total_amount}. Создано: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Новая продажа',
                            'content' => 'Продажа #{sale_number} создана. Общая сумма: {total_amount}.'
                        ]
                    ],
                    'tr' => [
                        'slack' => [
                            'title' => 'Yeni satış oluşturuldu',
                            'content' => 'Müşteri {customer_name} için #{sale_number} numaralı yeni bir satış oluşturuldu. Toplam Tutar: {total_amount}. Oluşturan: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Yeni satış',
                            'content' => 'Satış #{sale_number} oluşturuldu. Toplam Tutar: {total_amount}.'
                        ]
                    ],
                    'ar' => [
                        'slack' => [
                            'title' => 'تم إنشاء عملية بيع جديدة',
                            'content' => 'تم إنشاء عملية بيع جديدة #{sale_number} للعميل {customer_name}. المبلغ الإجمالي: {total_amount}. تم الإنشاء بواسطة: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'بيع جديد',
                            'content' => 'تم إنشاء بيع #{sale_number}. المبلغ الإجمالي: {total_amount}.'
                        ]
                    ],
                    'he' => [
                        'slack' => [
                            'title' => 'נוצרה מכירה חדשה',
                            'content' => 'נוצרה מכירה חדשה #{sale_number} עבור הלקוח {customer_name}. סכום כולל: {total_amount}. נוצר על ידי: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'מכירה חדשה',
                            'content' => 'מכירה #{sale_number} נוצרה. סכום כולל: {total_amount}.'
                        ]
                    ],
                    'ja' => [
                        'slack' => [
                            'title' => '新しい販売が作成されました',
                            'content' => '顧客 {customer_name} 向けに新しい販売 #{sale_number} が作成されました。合計金額: {total_amount}。作成者: {created_by}。'
                        ],
                        'twilio' => [
                            'title' => '新規販売',
                            'content' => '販売 #{sale_number} が作成されました。合計金額: {total_amount}。'
                        ]
                    ],
                    'zh' => [
                        'slack' => [
                            'title' => '新增销售记录',
                            'content' => '已为客户 {customer_name} 创建新的销售 #{sale_number}。总金额：{total_amount}。创建人：{created_by}。'
                        ],
                        'twilio' => [
                            'title' => '新销售',
                            'content' => '销售 #{sale_number} 已创建。总金额：{total_amount}。'
                        ]
                    ],
                ]
            ],

            [
                'name' => 'New Purchase',
                'types' => ['slack', 'twilio'],
                'translations' => [
                    'en' => [
                        'slack' => [
                            'title' => 'New Purchase Created',
                            'content' => 'Purchase #{purchase_number} created from vendor {vendor_name}. Total: {total_amount}. Created by: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'New Purchase',
                            'content' => 'Purchase #{purchase_number} from {vendor_name}. Total: {total_amount}.'
                        ]
                    ],
                    'es' => [
                        'slack' => [
                            'title' => 'Nueva compra creada',
                            'content' => 'Compra #{purchase_number} creada del proveedor {vendor_name}. Total: {total_amount}. Creado por: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nueva compra',
                            'content' => 'Compra #{purchase_number} de {vendor_name}. Total: {total_amount}.'
                        ]
                    ],
                    'fr' => [
                        'slack' => [
                            'title' => 'Nouvel achat créé',
                            'content' => 'Achat #{purchase_number} créé auprès du fournisseur {vendor_name}. Total : {total_amount}. Créé par : {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nouvel achat',
                            'content' => 'Achat #{purchase_number} de {vendor_name}. Total : {total_amount}.'
                        ]
                    ],
                    'de' => [
                        'slack' => [
                            'title' => 'Neuer Einkauf erstellt',
                            'content' => 'Einkauf #{purchase_number} vom Anbieter {vendor_name} erstellt. Gesamt: {total_amount}. Erstellt von: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Neuer Einkauf',
                            'content' => 'Einkauf #{purchase_number} von {vendor_name}. Gesamt: {total_amount}.'
                        ]
                    ],
                    'it' => [
                        'slack' => [
                            'title' => 'Nuovo acquisto creato',
                            'content' => 'Acquisto #{purchase_number} creato dal fornitore {vendor_name}. Totale: {total_amount}. Creato da: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nuovo acquisto',
                            'content' => 'Acquisto #{purchase_number} da {vendor_name}. Totale: {total_amount}.'
                        ]
                    ],
                    'pt' => [
                        'slack' => [
                            'title' => 'Nova compra criada',
                            'content' => 'Compra #{purchase_number} criada do fornecedor {vendor_name}. Total: {total_amount}. Criado por: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nova compra',
                            'content' => 'Compra #{purchase_number} de {vendor_name}. Total: {total_amount}.'
                        ]
                    ],
                    'pt-BR' => [
                        'slack' => [
                            'title' => 'Nova compra criada',
                            'content' => 'Compra #{purchase_number} criada do fornecedor {vendor_name}. Total: {total_amount}. Criado por: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nova compra',
                            'content' => 'Compra #{purchase_number} de {vendor_name}. Total: {total_amount}.'
                        ]
                    ],
                    'nl' => [
                        'slack' => [
                            'title' => 'Nieuwe aankoop aangemaakt',
                            'content' => 'Aankoop #{purchase_number} aangemaakt van leverancier {vendor_name}. Totaal: {total_amount}. Aangemaakt door: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nieuwe aankoop',
                            'content' => 'Aankoop #{purchase_number} van {vendor_name}. Totaal: {total_amount}.'
                        ]
                    ],
                    'da' => [
                        'slack' => [
                            'title' => 'Nyt køb oprettet',
                            'content' => 'Køb #{purchase_number} oprettet fra leverandør {vendor_name}. Total: {total_amount}. Oprettet af: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nyt køb',
                            'content' => 'Køb #{purchase_number} fra {vendor_name}. Total: {total_amount}.'
                        ]
                    ],
                    'pl' => [
                        'slack' => [
                            'title' => 'Nowy zakup utworzony',
                            'content' => 'Zakup #{purchase_number} utworzony od dostawcy {vendor_name}. Łączna kwota: {total_amount}. Utworzono przez: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nowy zakup',
                            'content' => 'Zakup #{purchase_number} od {vendor_name}. Łączna kwota: {total_amount}.'
                        ]
                    ],
                    'ru' => [
                        'slack' => [
                            'title' => 'Создана новая покупка',
                            'content' => 'Покупка #{purchase_number} создана у поставщика {vendor_name}. Сумма: {total_amount}. Создано: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Новая покупка',
                            'content' => 'Покупка #{purchase_number} от {vendor_name}. Сумма: {total_amount}.'
                        ]
                    ],
                    'tr' => [
                        'slack' => [
                            'title' => 'Yeni satın alma oluşturuldu',
                            'content' => 'Satın alma #{purchase_number} tedarikçi {vendor_name} üzerinden oluşturuldu. Toplam: {total_amount}. Oluşturan: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Yeni satın alma',
                            'content' => 'Satın alma #{purchase_number} {vendor_name} üzerinden oluşturuldu. Toplam: {total_amount}.'
                        ]
                    ],
                    'ar' => [
                        'slack' => [
                            'title' => 'تم إنشاء عملية شراء جديدة',
                            'content' => 'تم إنشاء عملية شراء #{purchase_number} من البائع {vendor_name}. المجموع: {total_amount}. تم الإنشاء بواسطة: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'شراء جديد',
                            'content' => 'تم إنشاء شراء #{purchase_number} من {vendor_name}. المجموع: {total_amount}.'
                        ]
                    ],
                    'he' => [
                        'slack' => [
                            'title' => 'רכישה חדשה נוצרה',
                            'content' => 'רכישה #{purchase_number} נוצרה מהספק {vendor_name}. סך הכל: {total_amount}. נוצר על ידי: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'רכישה חדשה',
                            'content' => 'רכישה #{purchase_number} מ-{vendor_name}. סך הכל: {total_amount}.'
                        ]
                    ],
                    'ja' => [
                        'slack' => [
                            'title' => '新しい購入が作成されました',
                            'content' => 'ベンダー {vendor_name} から購入 #{purchase_number} が作成されました。合計: {total_amount}。作成者: {created_by}。'
                        ],
                        'twilio' => [
                            'title' => '新しい購入',
                            'content' => '購入 #{purchase_number} が {vendor_name} から作成されました。合計: {total_amount}。'
                        ]
                    ],
                    'zh' => [
                        'slack' => [
                            'title' => '创建新采购',
                            'content' => '已从供应商 {vendor_name} 创建采购 #{purchase_number}。总金额: {total_amount}。创建者: {created_by}。'
                        ],
                        'twilio' => [
                            'title' => '新采购',
                            'content' => '采购 #{purchase_number} 来自 {vendor_name}。总金额: {total_amount}。'
                        ]
                    ],
                ]
            ],
           [
    'name' => 'New Expense',
    'types' => ['slack'],
    'translations' => [
        'en' => [
            'slack' => [
                'title' => 'New Expense Added',
                'content' => 'A new expense "{expense_title}" of {amount} has been recorded under category "{category}".'
            ]
        ],
        'es' => [
            'slack' => [
                'title' => 'Nuevo gasto agregado',
                'content' => 'Se ha registrado un nuevo gasto "{expense_title}" de {amount} en la categoría "{category}".'
            ]
        ],
        'fr' => [
            'slack' => [
                'title' => 'Nouvelle dépense ajoutée',
                'content' => 'Une nouvelle dépense "{expense_title}" de {amount} a été enregistrée dans la catégorie "{category}".'
            ]
        ],
        'de' => [
            'slack' => [
                'title' => 'Neue Ausgabe hinzugefügt',
                'content' => 'Eine neue Ausgabe "{expense_title}" über {amount} wurde in der Kategorie "{category}" erfasst.'
            ]
        ],
        'it' => [
            'slack' => [
                'title' => 'Nuova spesa aggiunta',
                'content' => 'Una nuova spesa "{expense_title}" di {amount} è stata registrata nella categoria "{category}".'
            ]
        ],
        'pt' => [
            'slack' => [
                'title' => 'Nova despesa adicionada',
                'content' => 'Uma nova despesa "{expense_title}" de {amount} foi registrada na categoria "{category}".'
            ]
        ],
        'pt-BR' => [
            'slack' => [
                'title' => 'Nova despesa adicionada',
                'content' => 'Uma nova despesa "{expense_title}" de {amount} foi registrada na categoria "{category}".'
            ]
        ],
        'nl' => [
            'slack' => [
                'title' => 'Nieuwe uitgave toegevoegd',
                'content' => 'Een nieuwe uitgave "{expense_title}" van {amount} is geregistreerd in de categorie "{category}".'
            ]
        ],
        'da' => [
            'slack' => [
                'title' => 'Ny udgift tilføjet',
                'content' => 'En ny udgift "{expense_title}" på {amount} er registreret under kategorien "{category}".'
            ]
        ],
        'pl' => [
            'slack' => [
                'title' => 'Nowy wydatek dodany',
                'content' => 'Nowy wydatek "{expense_title}" w wysokości {amount} został zapisany w kategorii "{category}".'
            ]
        ],
        'ru' => [
            'slack' => [
                'title' => 'Добавлен новый расход',
                'content' => 'Новый расход "{expense_title}" на сумму {amount} был зафиксирован в категории "{category}".'
            ]
        ],
        'tr' => [
            'slack' => [
                'title' => 'Yeni Gider Eklendi',
                'content' => '"{expense_title}" gideri, {amount} tutarında "{category}" kategorisine kaydedildi.'
            ]
        ],
        'ar' => [
            'slack' => [
                'title' => 'تمت إضافة مصروف جديد',
                'content' => 'تم تسجيل مصروف جديد "{expense_title}" بمبلغ {amount} ضمن الفئة "{category}".'
            ]
        ],
        'he' => [
            'slack' => [
                'title' => 'הוצאה חדשה נוספה',
                'content' => 'הוצאה חדשה "{expense_title}" בסכום {amount} נרשמה בקטגוריה "{category}".'
            ]
        ],
        'ja' => [
            'slack' => [
                'title' => '新しい経費が追加されました',
                'content' => '経費 "{expense_title}" が {amount} でカテゴリ "{category}" に記録されました。'
            ]
        ],
        'zh' => [
            'slack' => [
                'title' => '新增费用',
                'content' => '新费用 "{expense_title}" 已记录，金额 {amount}，类别 "{category}"。'
            ]
        ]
    ]
        ],
          [
                'name' => 'New Vendor',
                'types' => ['slack', 'twilio'],
                'translations' => [
                    'en' => [
                        'slack' => [
                            'title' => 'New Vendor Added',
                            'content' => 'New vendor "{vendor_name}" has been added. Email: {vendor_email}, Phone: {vendor_phone}. Created by: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'New Vendor',
                            'content' => 'New vendor {vendor_name} added by {created_by}.'
                        ]
                    ],
                    'es' => [
                        'slack' => [
                            'title' => 'Nuevo proveedor agregado',
                            'content' => 'Nuevo proveedor "{vendor_name}" agregado. Email: {vendor_email}, Teléfono: {vendor_phone}. Creado por: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nuevo proveedor',
                            'content' => 'Nuevo proveedor {vendor_name} agregado por {created_by}.'
                        ]
                    ],
                    'fr' => [
                        'slack' => [
                            'title' => 'Nouveau fournisseur ajouté',
                            'content' => 'Nouveau fournisseur "{vendor_name}" ajouté. Email: {vendor_email}, Téléphone: {vendor_phone}. Créé par: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nouveau fournisseur',
                            'content' => 'Nouveau fournisseur {vendor_name} ajouté par {created_by}.'
                        ]
                    ],
                    'de' => [
                        'slack' => [
                            'title' => 'Neuer Lieferant hinzugefügt',
                            'content' => 'Neuer Lieferant "{vendor_name}" hinzugefügt. Email: {vendor_email}, Telefon: {vendor_phone}. Erstellt von: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Neuer Lieferant',
                            'content' => 'Neuer Lieferant {vendor_name} hinzugefügt von {created_by}.'
                        ]
                    ],
                    'it' => [
                        'slack' => [
                            'title' => 'Nuovo fornitore aggiunto',
                            'content' => 'Nuovo fornitore "{vendor_name}" aggiunto. Email: {vendor_email}, Telefono: {vendor_phone}. Creato da: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nuovo fornitore',
                            'content' => 'Nuovo fornitore {vendor_name} aggiunto da {created_by}.'
                        ]
                    ],
                    'pt' => [
                        'slack' => [
                            'title' => 'Novo fornecedor adicionado',
                            'content' => 'Novo fornecedor "{vendor_name}" adicionado. Email: {vendor_email}, Telefone: {vendor_phone}. Criado por: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Novo fornecedor',
                            'content' => 'Novo fornecedor {vendor_name} adicionado por {created_by}.'
                        ]
                    ],
                    'pt-BR' => [
                        'slack' => [
                            'title' => 'Novo fornecedor adicionado',
                            'content' => 'Novo fornecedor "{vendor_name}" adicionado. Email: {vendor_email}, Telefone: {vendor_phone}. Criado por: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Novo fornecedor',
                            'content' => 'Novo fornecedor {vendor_name} adicionado por {created_by}.'
                        ]
                    ],
                    'nl' => [
                        'slack' => [
                            'title' => 'Nieuwe leverancier toegevoegd',
                            'content' => 'Nieuwe leverancier "{vendor_name}" toegevoegd. Email: {vendor_email}, Telefoon: {vendor_phone}. Aangemaakt door: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nieuwe leverancier',
                            'content' => 'Nieuwe leverancier {vendor_name} toegevoegd door {created_by}.'
                        ]
                    ],
                    'da' => [
                        'slack' => [
                            'title' => 'Ny leverandør tilføjet',
                            'content' => 'Ny leverandør "{vendor_name}" tilføjet. Email: {vendor_email}, Telefon: {vendor_phone}. Oprettet af: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Ny leverandør',
                            'content' => 'Ny leverandør {vendor_name} tilføjet af {created_by}.'
                        ]
                    ],
                    'pl' => [
                        'slack' => [
                            'title' => 'Dodano nowego dostawcę',
                            'content' => 'Dodano nowego dostawcę "{vendor_name}". Email: {vendor_email}, Telefon: {vendor_phone}. Utworzono przez: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nowy dostawca',
                            'content' => 'Nowy dostawca {vendor_name} dodany przez {created_by}.'
                        ]
                    ],
                    'ru' => [
                        'slack' => [
                            'title' => 'Добавлен новый поставщик',
                            'content' => 'Новый поставщик "{vendor_name}" добавлен. Email: {vendor_email}, Телефон: {vendor_phone}. Создано: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Новый поставщик',
                            'content' => 'Новый поставщик {vendor_name} добавлен {created_by}.'
                        ]
                    ],
                    'tr' => [
                        'slack' => [
                            'title' => 'Yeni Tedarikçi Eklendi',
                            'content' => 'Yeni tedarikçi "{vendor_name}" eklendi. Email: {vendor_email}, Telefon: {vendor_phone}. Oluşturan: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Yeni Tedarikçi',
                            'content' => 'Yeni tedarikçi {vendor_name} eklendi {created_by}.'
                        ]
                    ],
                    'ar' => [
                        'slack' => [
                            'title' => 'تم إضافة مورد جديد',
                            'content' => 'تمت إضافة المورد الجديد "{vendor_name}". البريد الإلكتروني: {vendor_email}, الهاتف: {vendor_phone}. تم الإنشاء بواسطة: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'مورد جديد',
                            'content' => 'تمت إضافة المورد الجديد {vendor_name} بواسطة {created_by}.'
                        ]
                    ],
                    'he' => [
                        'slack' => [
                            'title' => 'ספק חדש נוסף',
                            'content' => 'ספק חדש "{vendor_name}" נוסף. דוא"ל: {vendor_email}, טלפון: {vendor_phone}. נוצר על ידי: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'ספק חדש',
                            'content' => 'ספק חדש {vendor_name} נוסף על ידי {created_by}.'
                        ]
                    ],
                    'ja' => [
                        'slack' => [
                            'title' => '新しいベンダーが追加されました',
                            'content' => '新しいベンダー "{vendor_name}" が追加されました。Email: {vendor_email}, 電話: {vendor_phone}. 作成者: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => '新しいベンダー',
                            'content' => '新しいベンダー {vendor_name} が追加されました。作成者: {created_by}.'
                        ]
                    ],
                    'zh' => [
                        'slack' => [
                            'title' => '新增供应商',
                            'content' => '供应商 "{vendor_name}" 已添加。邮箱: {vendor_email}, 电话: {vendor_phone}. 创建者: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => '新供应商',
                            'content' => '供应商 {vendor_name} 已添加，由 {created_by}.'
                        ]
                    ],
                ]
            ],

            [
                'name' => 'New Quotation',
                'types' => ['slack', 'twilio'],
                'translations' => [
                    'en' => [
                        'slack' => [
                            'title' => 'New Quotation Created',
                            'content' => 'Quotation #{quotation_number} created for customer {customer_name}. Total Amount: {total_amount}. Created by: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'New Quotation',
                            'content' => 'Quotation #{quotation_number} created. Total Amount: {total_amount}.'
                        ]
                    ],
                    'es' => [
                        'slack' => [
                            'title' => 'Nueva cotización creada',
                            'content' => 'Cotización #{quotation_number} creada para el cliente {customer_name}. Monto total: {total_amount}. Creado por: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nueva cotización',
                            'content' => 'Cotización #{quotation_number} creada. Monto total: {total_amount}.'
                        ]
                    ],
                    'fr' => [
                        'slack' => [
                            'title' => 'Nouvelle devis créé',
                            'content' => 'Devis #{quotation_number} créé pour le client {customer_name}. Montant total: {total_amount}. Créé par: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nouveau devis',
                            'content' => 'Devis #{quotation_number} créé. Montant total: {total_amount}.'
                        ]
                    ],
                    'de' => [
                        'slack' => [
                            'title' => 'Neues Angebot erstellt',
                            'content' => 'Angebot #{quotation_number} für Kunde {customer_name} erstellt. Gesamtbetrag: {total_amount}. Erstellt von: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Neues Angebot',
                            'content' => 'Angebot #{quotation_number} erstellt. Gesamtbetrag: {total_amount}.'
                        ]
                    ],
                    'it' => [
                        'slack' => [
                            'title' => 'Nuovo preventivo creato',
                            'content' => 'Preventivo #{quotation_number} creato per il cliente {customer_name}. Importo totale: {total_amount}. Creato da: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nuovo preventivo',
                            'content' => 'Preventivo #{quotation_number} creato. Importo totale: {total_amount}.'
                        ]
                    ],
                    'pt' => [
                        'slack' => [
                            'title' => 'Nova cotação criada',
                            'content' => 'Cotação #{quotation_number} criada para o cliente {customer_name}. Valor total: {total_amount}. Criado por: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nova cotação',
                            'content' => 'Cotação #{quotation_number} criada. Valor total: {total_amount}.'
                        ]
                    ],
                    'pt-BR' => [
                        'slack' => [
                            'title' => 'Nova cotação criada',
                            'content' => 'Cotação #{quotation_number} criada para o cliente {customer_name}. Valor total: {total_amount}. Criado por: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nova cotação',
                            'content' => 'Cotação #{quotation_number} criada. Valor total: {total_amount}.'
                        ]
                    ],
                    'nl' => [
                        'slack' => [
                            'title' => 'Nieuwe offerte aangemaakt',
                            'content' => 'Offerte #{quotation_number} aangemaakt voor klant {customer_name}. Totaalbedrag: {total_amount}. Aangemaakt door: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nieuwe offerte',
                            'content' => 'Offerte #{quotation_number} aangemaakt. Totaalbedrag: {total_amount}.'
                        ]
                    ],
                    'da' => [
                        'slack' => [
                            'title' => 'Ny tilbud oprettet',
                            'content' => 'Tilbud #{quotation_number} oprettet til kunde {customer_name}. Totalbeløb: {total_amount}. Oprettet af: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nyt tilbud',
                            'content' => 'Tilbud #{quotation_number} oprettet. Totalbeløb: {total_amount}.'
                        ]
                    ],
                    'pl' => [
                        'slack' => [
                            'title' => 'Nowa oferta utworzona',
                            'content' => 'Oferta #{quotation_number} utworzona dla klienta {customer_name}. Kwota całkowita: {total_amount}. Utworzone przez: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Nowa oferta',
                            'content' => 'Oferta #{quotation_number} utworzona. Kwota całkowita: {total_amount}.'
                        ]
                    ],
                    'ru' => [
                        'slack' => [
                            'title' => 'Создана новая квотация',
                            'content' => 'Квотация #{quotation_number} создана для клиента {customer_name}. Общая сумма: {total_amount}. Создано: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Новая квотация',
                            'content' => 'Квотация #{quotation_number} создана. Общая сумма: {total_amount}.'
                        ]
                    ],
                    'tr' => [
                        'slack' => [
                            'title' => 'Yeni Teklif Oluşturuldu',
                            'content' => 'Teklif #{quotation_number} müşterisi {customer_name} için oluşturuldu. Toplam Tutar: {total_amount}. Oluşturan: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'Yeni Teklif',
                            'content' => 'Teklif #{quotation_number} oluşturuldu. Toplam Tutar: {total_amount}.'
                        ]
                    ],
                    'ar' => [
                        'slack' => [
                            'title' => 'تم إنشاء عرض جديد',
                            'content' => 'تم إنشاء عرض #{quotation_number} للعميل {customer_name}. المبلغ الإجمالي: {total_amount}. تم الإنشاء بواسطة: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'عرض جديد',
                            'content' => 'تم إنشاء عرض #{quotation_number}. المبلغ الإجمالي: {total_amount}.'
                        ]
                    ],
                    'he' => [
                        'slack' => [
                            'title' => 'ציטוט חדש נוצר',
                            'content' => 'ציטוט #{quotation_number} נוצר עבור הלקוח {customer_name}. סכום כולל: {total_amount}. נוצר על ידי: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => 'ציטוט חדש',
                            'content' => 'ציטוט #{quotation_number} נוצר. סכום כולל: {total_amount}.'
                        ]
                    ],
                    'ja' => [
                        'slack' => [
                            'title' => '新しい見積もりが作成されました',
                            'content' => '見積もり #{quotation_number} が顧客 {customer_name} のために作成されました。合計金額: {total_amount}. 作成者: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => '新しい見積もり',
                            'content' => '見積もり #{quotation_number} 作成。合計金額: {total_amount}.'
                        ]
                    ],
                    'zh' => [
                        'slack' => [
                            'title' => '创建新报价',
                            'content' => '报价 #{quotation_number} 已为客户 {customer_name} 创建。总金额: {total_amount}. 创建者: {created_by}.'
                        ],
                        'twilio' => [
                            'title' => '新报价',
                            'content' => '报价 #{quotation_number} 已创建。总金额: {total_amount}.'
                        ]
                    ],
                ]
                ],
                [
    'name' => 'Send Quotation',
    'types' => ['slack', 'twilio'],
    'translations' => [
        'en' => [
            'slack' => [
                'title' => 'Quotation Sent',
                'content' => 'Quotation #{quotation_number} has been sent to customer {customer_name}. Total Amount: {total_amount}. Sent by: {sent_by}.'
            ],
            'twilio' => [
                'title' => 'Quotation Sent',
                'content' => 'Quotation #{quotation_number} sent. Total Amount: {total_amount}.'
            ]
        ],

        'es' => [
            'slack' => [
                'title' => 'Cotización enviada',
                'content' => 'La cotización #{quotation_number} ha sido enviada al cliente {customer_name}. Monto total: {total_amount}. Enviado por: {sent_by}.'
            ],
            'twilio' => [
                'title' => 'Cotización enviada',
                'content' => 'Cotización #{quotation_number} enviada. Monto total: {total_amount}.'
            ]
        ],

        'fr' => [
            'slack' => [
                'title' => 'Devis envoyé',
                'content' => 'Le devis #{quotation_number} a été envoyé au client {customer_name}. Montant total : {total_amount}. Envoyé par : {sent_by}.'
            ],
            'twilio' => [
                'title' => 'Devis envoyé',
                'content' => 'Devis #{quotation_number} envoyé. Montant total : {total_amount}.'
            ]
        ],

        'de' => [
            'slack' => [
                'title' => 'Angebot gesendet',
                'content' => 'Angebot #{quotation_number} wurde an den Kunden {customer_name} gesendet. Gesamtbetrag: {total_amount}. Gesendet von: {sent_by}.'
            ],
            'twilio' => [
                'title' => 'Angebot gesendet',
                'content' => 'Angebot #{quotation_number} gesendet. Gesamtbetrag: {total_amount}.'
            ]
        ],

        'it' => [
            'slack' => [
                'title' => 'Preventivo inviato',
                'content' => 'Il preventivo #{quotation_number} è stato inviato al cliente {customer_name}. Importo totale: {total_amount}. Inviato da: {sent_by}.'
            ],
            'twilio' => [
                'title' => 'Preventivo inviato',
                'content' => 'Preventivo #{quotation_number} inviato. Importo totale: {total_amount}.'
            ]
        ],

        'pt' => [
            'slack' => [
                'title' => 'Cotação enviada',
                'content' => 'A cotação #{quotation_number} foi enviada para o cliente {customer_name}. Valor total: {total_amount}. Enviado por: {sent_by}.'
            ],
            'twilio' => [
                'title' => 'Cotação enviada',
                'content' => 'Cotação #{quotation_number} enviada. Valor total: {total_amount}.'
            ]
        ],

        'pt-BR' => [
            'slack' => [
                'title' => 'Cotação enviada',
                'content' => 'A cotação #{quotation_number} foi enviada para o cliente {customer_name}. Valor total: {total_amount}. Enviado por: {sent_by}.'
            ],
            'twilio' => [
                'title' => 'Cotação enviada',
                'content' => 'Cotação #{quotation_number} enviada. Valor total: {total_amount}.'
            ]
        ],

        'nl' => [
            'slack' => [
                'title' => 'Offerte verzonden',
                'content' => 'Offerte #{quotation_number} is verzonden naar klant {customer_name}. Totaalbedrag: {total_amount}. Verzonden door: {sent_by}.'
            ],
            'twilio' => [
                'title' => 'Offerte verzonden',
                'content' => 'Offerte #{quotation_number} verzonden. Totaalbedrag: {total_amount}.'
            ]
        ],

        'da' => [
            'slack' => [
                'title' => 'Tilbud sendt',
                'content' => 'Tilbud #{quotation_number} er sendt til kunden {customer_name}. Totalbeløb: {total_amount}. Sendt af: {sent_by}.'
            ],
            'twilio' => [
                'title' => 'Tilbud sendt',
                'content' => 'Tilbud #{quotation_number} sendt. Totalbeløb: {total_amount}.'
            ]
        ],

        'pl' => [
            'slack' => [
                'title' => 'Wysłano ofertę',
                'content' => 'Oferta #{quotation_number} została wysłana do klienta {customer_name}. Kwota całkowita: {total_amount}. Wysłane przez: {sent_by}.'
            ],
            'twilio' => [
                'title' => 'Oferta wysłana',
                'content' => 'Oferta #{quotation_number} wysłana. Kwota całkowita: {total_amount}.'
            ]
        ],

        'ru' => [
            'slack' => [
                'title' => 'Квотация отправлена',
                'content' => 'Квотация #{quotation_number} отправлена клиенту {customer_name}. Общая сумма: {total_amount}. Отправлено: {sent_by}.'
            ],
            'twilio' => [
                'title' => 'Квотация отправлена',
                'content' => 'Квотация #{quotation_number} отправлена. Общая сумма: {total_amount}.'
            ]
        ],

        'tr' => [
            'slack' => [
                'title' => 'Teklif Gönderildi',
                'content' => 'Teklif #{quotation_number}, {customer_name} müşterisine gönderildi. Toplam Tutar: {total_amount}. Gönderen: {sent_by}.'
            ],
            'twilio' => [
                'title' => 'Teklif Gönderildi',
                'content' => 'Teklif #{quotation_number} gönderildi. Toplam Tutar: {total_amount}.'
            ]
        ],

        'ar' => [
            'slack' => [
                'title' => 'تم إرسال العرض',
                'content' => 'تم إرسال العرض #{quotation_number} إلى العميل {customer_name}. المبلغ الإجمالي: {total_amount}. تم الإرسال بواسطة: {sent_by}.'
            ],
            'twilio' => [
                'title' => 'تم إرسال العرض',
                'content' => 'تم إرسال العرض #{quotation_number}. المبلغ الإجمالي: {total_amount}.'
            ]
        ],

        'he' => [
            'slack' => [
                'title' => 'הצעת מחיר נשלחה',
                'content' => 'הצעת מחיר #{quotation_number} נשלחה ללקוח {customer_name}. סכום כולל: {total_amount}. נשלח על ידי: {sent_by}.'
            ],
            'twilio' => [
                'title' => 'הצעת מחיר נשלחה',
                'content' => 'הצעת מחיר #{quotation_number} נשלחה. סכום כולל: {total_amount}.'
            ]
        ],

        'ja' => [
            'slack' => [
                'title' => '見積書を送信しました',
                'content' => '見積書 #{quotation_number} が顧客 {customer_name} に送信されました。合計金額: {total_amount}. 送信者: {sent_by}.'
            ],
            'twilio' => [
                'title' => '見積書送信',
                'content' => '見積書 #{quotation_number} を送信しました。合計金額: {total_amount}.'
            ]
        ],

        'zh' => [
            'slack' => [
                'title' => '报价已发送',
                'content' => '报价 #{quotation_number} 已发送给客户 {customer_name}。总金额: {total_amount}. 发送者: {sent_by}.'
            ],
            'twilio' => [
                'title' => '报价已发送',
                'content' => '报价 #{quotation_number} 已发送。总金额: {total_amount}.'
            ]
        ],
    ]
]

        ];
    $companies = \App\Models\User::where('type', 'company')->get();

        foreach ($templates as $templateData) {
          foreach ($templateData['types'] as $type) {
                // Create template for each type
                $template = NotificationTemplate::updateOrCreate(
                    [
                        'name' => $templateData['name'],
                        'type' => $type
                    ],
                    [
                        'name' => $templateData['name'],
                        'type' => $type
                    ]
                );


            // Create content for each company
            foreach ($companies as $company) {
                foreach ($langCodes as $langCode) {
                    $existingContent = NotificationTemplateLang::where('parent_id', $template->id)
                        ->where('lang', $langCode)
                        ->where('created_by', $company->id)
                        ->first();

                    if ($existingContent) {
                        continue;
                    }

                    $translation = $templateData['translations'][$langCode] ?? $templateData['translations']['en'];

                    NotificationTemplateLang::create([
                        'parent_id' => $template->id,
                        'lang' => $langCode,
                        'title' => $translation[$type]['title'],
                        'content' => $translation[$type]['content'],
                        'created_by' => $company->id
                    ]);
                }
            }
            // Create content for global template
            foreach ($langCodes as $langCode) {
                $existingContent = NotificationTemplateLang::where('parent_id', $template->id)
                    ->where('lang', $langCode)
                    ->where('created_by', 1)
                    ->first();

                if ($existingContent) {
                    continue;
                }

                $translation = $templateData['translations'][$langCode] ?? $templateData['translations']['en'];

                NotificationTemplateLang::create([
                    'parent_id' => $template->id,
                    'lang' => $langCode,
                    'title' => $translation[$type]['title'],
                    'content' => $translation[$type]['content'],
                    'created_by' => 1
                ]);
            }
        }
    }
}

}
