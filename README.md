# ReadRibbon

A Discord reading-time helper for Turkish and English communities. Privately count a short text, choose a reading pace, and optionally share a summary **without the source text**.

Türkçe ve İngilizce topluluklar için Discord okuma süresi yardımcısı. Kısa bir metni özel yanıtta sayar, seçtiğiniz hızla tahmini süre hesaplar ve isterseniz **kaynak metni içermeyen** özeti paylaşır.

[Türkçe](#türkçe) · [English](#english) · [License](LICENSE)

## Türkçe

### Amaç ve özellikler

Kitap kulüpleri, çalışma grupları ve duyuru hazırlayan topluluk üyeleri bir metnin yaklaşık ne kadar zaman alacağını görebilir. `/readribbon` komutu özel bir önizleme açar. **Bu özeti paylaş** düğmesi ancak sizin tıklamanızla, önizlemedeki sayıları ve isteğe bağlı başlığı aynı kanala gönderir. Kaynak metin gönderilmez. **Vazgeç** kayıtlı özeti siler.

- İngilizce veya Türkçe sözcük ayrımı ve yanıt dili; seçim yapılmazsa Discord diliniz Türkçeyse Türkçe, aksi halde İngilizce.
- 1–4000 UTF-16 kod birimi girdi; en az bir sözcük benzeri bölüm gerekir. Discord karakter sınırı ile uyumludur; bazı emojiler birden fazla birim kullanır.
- 100–600 sözcük/dakika arasında tam sayı hız; varsayılan 200 yalnızca seçilebilir bir başlangıç değeridir, kişisel hız ölçümü değildir.
- Sözcük sayısı, tüm girdinin Unicode kod noktası sayısı ve yukarı yuvarlanmış tahmini saniye. Kod noktası sayısı görsel harf/emoji sayısı değildir.
- 80 UTF-16 birimine kadar isteğe bağlı tek satırlı başlık. Başlık **paylaşıma dahildir**; kontrol/görünmez yönlendirme karakterleri reddedilir, Markdown kaçırılır ve `@` işaretleri nötrleştirilir.
- Beş dakikalık, kullanıcı/sunucu/kanal/önizleme mesajına bağlı tek kullanımlık düğmeler. Mention bildirimleri ve bağlantı önizlemeleri kapalıdır.

Bot gerçek Discord Gateway bağlantısıyla çalışır. Bir GitHub Action botun kendisi değildir; buradaki Actions yalnızca kaynak kodu test eder.

### Yaptıkları, sınırları ve yapmadıkları

Hesap: `tahmini saniye = ceil(sözcük sayısı × 60 / seçilen hız)`. Sözcükler Node'un `Intl.Segmenter` sözcük ayrımıyla sayılır; sayı içeren bölümler de sayılabilir. Markdown, kod, URL ve metindeki diğer biçimlendirmeler temizlenmez. Bağlantılardaki içerik alınmaz. Bu nedenle karmaşık metinlerde sonuç beklediğinizden farklı olabilir. İngilizce/Türkçe dışındaki diller için sonuç vaat edilmez. Bu bir okuma becerisi değerlendirmesi, erişilebilirlik sertifikası veya kesin süre ölçümü değildir. Gerçek hız kişiye, metne, araca ve güne göre değişir.

Bot mesaj geçmişini okumaz, dosya/URL indirmez, metin özetlemez/çevirmez, konuşma/ses bağlantısı kurmaz, DM göndermez, rol veya kanal düzenlemez. Kaynak metni yeniden yayımlamaz; başlığı kendiniz ayrı girdiyseniz başlık özette görünür. Yapay zekâ servisi, veritabanı, web paneli, okuma geçmişi veya telemetri yoktur. Paylaşım bir normal kanal mesajıdır; duyurular otomatik crosspost edilmez. Thread/forum/ses/DM kanalları desteklenmez. Tek yapılandırılmış sunucu ve tek çalışan süreç içindir.

### Gereksinimler

- Kendi Discord hesabınız, kendi Discord uygulamanız ve bot tokenınız.
- Botu ekleyebileceğiniz test sunucusu ve sunucuyu yönetme izni.
- [Node.js](https://nodejs.org/en/download) **24.13 veya üstü 24.x**, beraberindeki npm, internet ve normal bir terminal. Node 25/26 destek aralığında değildir. Yardımcılar Node'u kurmaz.
- Windows, macOS veya Linux. macOS/Linux yardımcıları Bash gerektirir. Canlı kullanım için açık kalan bilgisayar veya sizin yönettiğiniz sunucu gerekir.

### Developer Portal: ilk kurulum

1. [Discord Developer Portal](https://discord.com/developers/applications) adresinde **New Application** ile size ait yeni bir uygulama oluşturun; adını ReadRibbon koyabilirsiniz.
2. **General Information** bölümündeki **Application ID** değerini kopyalayın. Bu token değildir.
3. **Bot** bölümünden bot kullanıcısını oluşturun (zaten varsa devam edin). **Reset Token** / token gösterme adımıyla tokenı alın. Tokenı kimseye göndermeyin; ekran görüntüsü, GitHub, destek mesajı ve sohbet içine koymayın. Sızarsa hemen Reset Token yapın ve yerel kurulumu yenileyin. Yeni token eski tokenı geçersiz kılar.
4. **Privileged Gateway Intents** altındaki Presence, Server Members ve Message Content anahtarlarını **kapalı bırakın**. **Interactions Endpoint URL** girmeyin; bu bot Gateway kullanır. Mevcut başka uygulamanızın ayarlarını değiştirmek yerine ayrı uygulama oluşturun.
5. **Installation** bölümünde **Guild Install** (sunucuya kurulum) kullanın. OAuth2 kapsamları `bot` ve `applications.commands`; bot izinleri yalnızca **View Channels / Kanalı Görüntüle** ve **Send Messages / Mesaj Gönder** (`3072`). **Administrator**, Manage Messages, Read Message History ve diğer izinleri vermeyin. Kurulum yardımcısı aynı izinlerle tıklanabilir davet URL'si üretir.
6. Discord kullanıcı ayarları → Advanced/Gelişmiş → **Developer Mode/Geliştirici Modu** açın. Test sunucusunun adına sağ tıklayın → **Copy Server ID/Sunucu Kimliğini Kopyala**. Kanal kimliği kullanmayın.
7. Bu depoda **Code → Download ZIP** seçip yeni bir klasöre çıkarın. Alternatif: `git clone https://github.com/euglado/readribbon.git`. ZIP'in içindeki gerçek proje klasörüne girin; içinde `package.json` olmalı. Kaynak kod düzenlemeniz gerekmez.

### Windows'ta çalıştırma

Node kurulumundan sonra yeni terminal açın. Proje klasöründeki **setup.cmd** dosyasını çift tıklayın. Yardımcı bağımlılıkları kilitli sürümlerle kurar, derler ve kurulum sihirbazını açar. Application ID ve Server ID değerlerini girin; yazdırılan davet bağlantısını tarayıcıda açıp **doğru test sunucusuna** ekleyin. Sihirbaza `YES` yazın. Token sorusunda tokenı yapıştırın; karakterler ekranda görünmez. Enter'a basın. Sihirbaz yerel `.env` oluşturur; ardından komut kaydedilir.

Sonra **start.cmd** dosyasını açın. `ReadRibbon ready / hazır` gördüğünüzde Discord'da komutu deneyin. Kapatmak için terminalde Ctrl+C kullanın. Yol veya tıklama sorunu olursa PowerShell/Terminal'i proje klasöründe açıp `cmd /c setup.cmd` veya `cmd /c start.cmd` çalıştırabilirsiniz. Sistem yürütme politikasını gevşetmeniz gerekmez.

### macOS/Linux'ta çalıştırma

Terminal'i proje klasöründe açın ve `bash setup.sh` çalıştırın. Kimlikleri girin, yazdırılan davet bağlantısını açın, sunucuya ekleyin, `YES` yazın ve gizli token girişini tamamlayın. Ardından `bash start.sh` çalıştırın. Ctrl+C ile durdurun. Dosya izinlerini değiştirmek gerekmez. Setup etkileşimli terminal ister; tokenı komut satırı argümanı olarak vermeyin.

### Tüm sistemlerde elle komutlar ve yapılandırma

Terminal'de sırayla:

```sh
npm ci --ignore-scripts
npm run build
npm run setup
npm run register
npm start
```

Sihirbaz üç değer yazar: `DISCORD_TOKEN` (gizli bot tokenı), `DISCORD_APPLICATION_ID` (uygulama kimliği), `DISCORD_GUILD_ID` (sunucu kimliği). `.env.example` yalnızca alan adlarını gösterir; sihirbazı kullanınca düzenlemeniz gerekmez. ID değerleri 17–20 rakam olmalıdır. Kimlik ve token aynı uygulamaya ait olmalı. `.env` Git tarafından yok sayılır; ZIP/ekran paylaşımına eklemeyin. POSIX'te dosya `0600` ile oluşturulur; Windows'ta klasörün hesap izinlerini kontrol edin. Paylaşılan/senkronize klasörde saklamayın.

Sihirbaz mevcut `.env` üzerine yazmaz. Değer değiştirmeniz gerekiyorsa botu durdurun; yalnızca **bu projenin** kendi `.env` dosyasını güvenli biçimde kaldırın, kurulumu yeniden çalıştırın. Kaynak kod değişikliği gerekmez. `/readribbon` aynı isimle güncellenir; kayıt işlemi başka isimli komutları topluca silmez. Ayrı uygulama kullanmanız yine önerilir.

### Kullanım ve örnek

1. Botu çalıştırın. Test sunucusunun normal metin kanalında `/readribbon` seçin.
2. `text` alanına `Merhaba dünya bugün kitap okuyoruz` girin. `language: Türkçe`, `pace: 200`, isterseniz `title: Kitap kulübü` seçin. Başlığın paylaşımda görüneceğini unutmayın.
3. Yalnızca sizin gördüğünüz yanıt **6 sözcük**, yaklaşık **0 dk 2 sn** gösterir. Bu girdiye ait kaynak metin yanıt/özette tekrarlanmaz.
4. Sayıları, hızı ve başlığı kontrol edin. **Bu özeti paylaş** aynı kanala normal mesaj gönderir; **Vazgeç** taslağı siler. Hiç tıklamazsanız taslak beş dakikada kullanım dışı kalır ve en geç sonraki 30 saniyelik temizlikte RAM'den kaldırılır.

Kullanıcı başına beş saniyede bir hesap; kanal başına 60 saniyede bir paylaşım vardır. En fazla 100 önizleme, kullanıcı/kanal bekleme haritalarında ayrı ayrı 500 kayıt tutulur. Kapasite dolduğunda işlem reddedilir. Bot yeniden başlayınca tüm RAM taslakları ve beklemeler silinir; eski düğmeler geçersiz kalır. Çoklu süreç bu limitleri paylaşmaz; tek süreç çalıştırın. Başarısız/izin reddedilmiş paylaşım denemesi taslağı ve kanal beklemesini tüketebilir. Discord gönderiminden sonraki ağ hatasında mesaj zaten oluşmuş olabilir; tekrar denemeden kanalı kontrol edin. Otomatik tekrar gönderim yapılmaz.

### İzinler ve güvenli varsayılanlar

Bot ve komutu kullanan üye hedef kanalda Kanalı Görüntüle ve Mesaj Gönder iznine sahip olmalı. Üyenin ayrıca sunucuda uygulama komutlarını kullanabilmesi gerekir. Bot yalnızca Guilds intent kullanır; ayrıcalıklı intent istemez. Paylaşımda kanal ve üye/bot izinleri API'den yeniden alınır. Eski bir izin önizlemesi yeterli sayılmaz; yine de izin kontrolü ve Discord gönderimi arasında platformdaki değişiklikler gönderimi engelleyebilir. Hata güvenli ve token/metin içermeyen mesajla bildirilir. Komut erişimini Server Settings → Integrations bölümünden daraltabilirsiniz.

### Güvenlik, gizlilik ve veriler

`text` komut girdisi Discord'a ve bot sürecine iletilir; **Discord'dan veya bot işletmecisinden gizli değildir**. Özel/ephemeral yanıt başkalarının kanalda görmesini sınırlar, şifreli veya kalıcı silinen bir kasa değildir. Hassas kişisel veri, parola, token veya gizli belge girmeyin. Program, hesaplamadan sonra taslakta yalnızca sayıları, dil/hızı, başlığı, sahip/sunucu/kanal/mesaj kimliklerini ve süre sonunu tutar. JS belleği için adli silme garantisi verilmez. SDK kullanıcı, üye ve mesaj önbellekleri kapalıdır; botun çalışması için sunucu/kanal metaverisi yine işlenir. Normal loglar yalnızca hazır/hata durumunu içerir, girdi veya API hata nesnelerini içermez.

Paylaşılmış başlık ve sayılar Discord mesajında kalır; RAM zaman aşımı, Vazgeç veya botun kapanması bu mesajı silmez. Ephemeral yanıtlar da Discord tarafında görünmeye devam edebilir. Yalnızca kendi paylaşımınızı sunucu izinlerinize göre Discord üzerinden silin; botta toplu silme işlevi yoktur. Başlıkta URL varsa önizleme kapalı olsa da tıklanabilir olabilir; link güvenliği taraması yapılmaz. Kullanıcılar içeriği kopyalayabilir. Sızıntı/bug bildirimleri için [SECURITY.md](SECURITY.md); rapora token/metin eklemeyin.

### Botu açık tutma ve güncelleme

Bilgisayar uyur, kapanır veya terminal kapanırsa bot çevrimdışı olur. Kesintisiz kullanım için kendinize ait sürekli açık bir hostta tek Node 24 süreci çalıştırın; mevcut üretim servislerinize müdahale etmeyin. Bu depo host, otomatik başlangıç veya uptime garantisi sağlamaz. Hostta `.env`/sır yönetimini yalnızca yetkili hesapla yapın, raw SDK debug loglarını açmayın. Bağlantı toparlanmazsa hata nedenini düzelttikten sonra süreci yeniden başlatın. Güncellemede botu durdurun, sürüm notlarını okuyun, yeni kaynakları alın, `.env`'yi gizli tutun ve `npm ci --ignore-scripts`, `npm run check`, `npm run register`, `npm start` çalıştırın. Kaynak dosya değişikliği gerekmez.

### Sorun giderme

- **npm/Node bulunamadı:** Node 24.13+ 24.x kurun, terminali yeniden açın; yardımcıları çıkarılmış proje klasöründe çalıştırın.
- **Setup required:** sihirbaz tamamlanmadı veya ID eksik/yanlış. `.env` bu proje klasöründe olmalı; tokenı hata raporuna koymayın.
- **Komut görünmüyor:** doğru uygulama ve sunucu kimliğini, davette `applications.commands` kapsamını, botun sunucuda olduğunu ve `npm run register` başarısını kontrol edin. Discord'u yenileyin. Sunucu Integrations izinleri ve üyenin Use Application Commands izni kısıtlıyor olabilir.
- **Could not log in / registration failed:** aynı uygulamanın bot tokenını kullandığınızdan emin olun. Client secret token değildir. İnternet bağlantısı/davet/ID kontrolü yapın. Sızan tokenı hemen yenileyin.
- **İzin hatası:** kanala özel role/member overwrite kuralları botu veya sizi engelleyebilir. Yalnızca gerekli iki izni düzeltin; Administrator vermeyin. Thread/forum/ses/DM yerine normal metin kanalına geçin.
- **Düğme geçersiz:** beş dakika geçti, bot yeniden başladı, yanlış kullanıcı/mesaj veya taslak kullanıldı. Yeni komut açın. Paylaşım beklemesiyse 60 saniye bekleyin.
- **4000 karakter / sözcük hatası:** metni kısaltın, en az bir sözcük ekleyin; yalnızca emoji/noktalama yeterli değildir. Görünmez kontrol içeren başlığı temizleyin.
- **Ekran okuyucu/mobil:** düğmeler metin etiketlidir, sonuç düz metindir; canlı istemci ve yardımcı teknoloji deneyimi otomatik test edilmedi. Sorunu sürüm/istemci bilgisiyle, özel metin olmadan bildirin.

### Testler, katkı ve lisans

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
```

`check`: Biome önerilen kural takımıyla lint/biçim, sıkı TypeScript derlemesi (bağımlılık tipleri dahil), Node testleri ve bağımlılık lisans/kayıt kaynağı/SHA-512/kurulum betiği ile kaynak gizli değer deseni taraması. Tarama her sırrı bulmayı garanti etmez; yerel `.env` okunmaz ve Git'te bulunmamalıdır. Testler sözcük/süre sınırları, gizlilik, eşzamanlı tek kullanım, süre sonu, limitler, izin değişimi, yanlış düğmeler ve kurulumun güvenli başarısızlığını kapsar. Discord etkileşimleri taklit edilir. Canlı token girişi, bot daveti, gerçek API davranışı, mobil/ekran okuyucu ve gerçek kesintisiz hosting ayrıca işletmeci tarafından denenmelidir. Test için token gerekmez; bu sürüm VDS üzerinde çalıştırılmadı.

GitHub CI aynı kontrolleri Ubuntu, Windows ve macOS 15 Intel'de çalıştırır; npm kurulum betikleri kapalı, Actions izinleri yalnızca `contents: read`, eylemler commit SHA'larına sabittir. Bash yardımcılarının sözdizimi CI'de ayrıca denetlenir. Windows yardımcılarının çift tıklama deneyimi otomatik test kapsamı dışındadır. Katkı için [CONTRIBUTING.md](CONTRIBUTING.md); MIT şartları için [LICENSE](LICENSE). Bağımlılıkların kendi lisansları korunur. Yazarlık veya canlı doğrulama hakkında ek iddia yapılmaz.

## English

### Purpose and features

Book clubs, study groups and members preparing announcements can estimate how much time a short text might take to read. `/readribbon` opens a private preview. **Share this summary** posts the exact counts and optional title shown above it, in the same channel, only after your click. It does **not** post the source text. **Discard** removes the stored draft summary.

- English or Turkish word segmentation and response language. Without a choice, a Turkish Discord locale selects Turkish; other locales select English.
- 1–4000 UTF-16 code units of input with at least one word-like segment. Some emoji use more than one unit.
- An integer pace from 100 to 600 words/minute. The default 200 is a configurable starting value, not a measured or recommended personal speed.
- Word count, Unicode code point count of the entire input, and estimated seconds rounded up. Code points are not visual letters or grapheme clusters.
- An optional single-line public title, up to 80 UTF-16 units. The title **will be shared**. Control/directional formatting characters are rejected; Markdown is escaped and `@` characters are neutralized.
- Five-minute, one-use buttons bound to their owner, server, channel and preview message. Mentions and link embeds are disabled.

This is a real Discord Gateway bot. GitHub Actions tests its source; it does not host the bot.

### Scope and limitations

Formula: `estimated seconds = ceil(word count × 60 / chosen pace)`. Node's `Intl.Segmenter` word segmentation counts word-like segments, including some numeric segments. Markdown, code, URLs and other formatting are counted as raw input, not rendered or stripped. URLs are not fetched. Complex text may therefore produce surprising counts. Languages other than English/Turkish are not supported with any accuracy promise. This is not a reading ability assessment, accessibility certification or exact duration measurement. Real pace varies by reader, text and assistive technology.

The bot does not read channel history, fetch files/URLs, summarize/translate text, join voice, send DMs, edit channels/roles, or republish the source. A title separately entered by you is included in the public summary. There is no AI service, database, web panel, reading history or telemetry. Summaries are ordinary channel messages; announcement crossposting is not performed. Threads, forums, voice channels and DMs are unsupported. Run one process for one configured server.

### Requirements

- Your own Discord account, Discord application and bot token.
- A test server where you can install a bot and manage the server.
- [Node.js](https://nodejs.org/en/download) **24.13 or newer 24.x**, its bundled npm, an internet connection and a regular terminal. Node 25/26 are outside the supported range. Helpers do not install Node.
- Windows, macOS or Linux; Bash for the macOS/Linux helpers. Live use needs your own always-on computer or host.

### Developer Portal and installation

1. Open the [Discord Developer Portal](https://discord.com/developers/applications), choose **New Application**, and create a separate application you own. You may name it ReadRibbon.
2. Copy **Application ID** from **General Information**. This is not the token.
3. On **Bot**, create the bot user if necessary, then obtain its token using **Reset Token** or the token display flow. Never share it in screenshots, GitHub, support messages or chat. If exposed, reset it immediately and reconfigure locally; resetting invalidates the old token.
4. Leave **Presence**, **Server Members** and **Message Content** privileged intents **off**. Do not set an **Interactions Endpoint URL**; this bot uses Gateway. Use a separate application rather than changing settings for an existing bot.
5. Under **Installation**, use **Guild Install**. Scopes: `bot`, `applications.commands`. Bot permissions: **View Channels**, **Send Messages** only (`3072`). Do not grant Administrator, Manage Messages, Read Message History or other permissions. The setup wizard prints a clickable invite with these scopes and permissions.
6. In Discord user settings → Advanced, enable **Developer Mode**. Right-click your test server's name → **Copy Server ID**. This is not a channel ID.
7. Choose **Code → Download ZIP** in this repository and extract into a new folder, or run `git clone https://github.com/euglado/readribbon.git`. Open the actual project folder containing `package.json`. You do not need to edit source code.

### Windows quick start

After installing Node, open a fresh terminal. Double-click **setup.cmd** in the extracted project folder. It installs locked dependencies without install scripts, builds, and starts the setup wizard. Enter Application ID and Server ID. Open the printed invite in your browser and add the bot to the **correct test server**. Type `YES` in the wizard. Paste the token at its hidden prompt; characters will not appear. Press Enter. The wizard writes a local `.env`; the helper then registers the command.

Open **start.cmd**. When `ReadRibbon ready / hazır` appears, try the command in Discord. Ctrl+C stops it. If double-clicking or path handling fails, open Terminal/PowerShell in the project folder and use `cmd /c setup.cmd` or `cmd /c start.cmd`. No execution policy change is needed.

### macOS/Linux quick start

Open Terminal in the project folder and run `bash setup.sh`. Enter the IDs, follow the printed invite, install in the correct server, confirm `YES`, and enter the hidden token. Run `bash start.sh` afterward. Ctrl+C stops it. You do not need to change file permissions. The setup wizard requires an interactive terminal; do not put the token in command-line arguments.

### Manual commands and configuration

Run these in order in the project folder:

```sh
npm ci --ignore-scripts
npm run build
npm run setup
npm run register
npm start
```

The wizard sets `DISCORD_TOKEN` (secret bot token), `DISCORD_APPLICATION_ID` (application ID), and `DISCORD_GUILD_ID` (server ID). `.env.example` documents the fields; using the wizard requires no editing. IDs must be 17–20 digits. Token and application ID must belong to the same app. `.env` is Git-ignored; keep it out of shared ZIPs/screenshots. POSIX creation uses mode `0600`; on Windows, protect the containing folder with your account permissions. Avoid shared or synchronized folders for real secrets.

The wizard refuses to overwrite `.env`. To change values, stop the bot, securely remove only **this project's** `.env`, and rerun setup. No source editing is needed. Registration upserts the same command name through the guild endpoint; it never bulk-replaces other command names. A separate app is still recommended.

### Usage

1. Start the bot, then choose `/readribbon` in an ordinary text channel in the test server.
2. Set `text: We read a short book together`, `language: English`, `pace: 200`, and optionally `title: Book club`. The title will be public if shared.
3. Only you see the preview: **6 words**, approximately **0 min 2 sec**. The source text is not repeated in the reply or summary.
4. Check the counts, speed and title. **Share this summary** posts an ordinary channel message; **Discard** removes the draft. If untouched, the draft becomes unusable after five minutes and is pruned from RAM by the next 30-second sweep.

There is one estimate per user per five seconds and one share per channel per 60 seconds. Limits: 100 previews, 500 user cooldown records and 500 channel cooldown records. Full capacity rejects new work. Restart clears all RAM drafts/cooldowns and invalidates old buttons. Limits are not shared between processes; run a single instance. Failed or permission-denied sharing attempts can consume the draft and the channel cooldown. If the network fails after sending, a message may already exist; check the channel before retrying. No automatic resend occurs.

### Permissions

Both bot and member need View Channel and Send Messages in the target channel. Members must also be allowed to use application commands in the server. Only the Guilds Gateway intent is used; no privileged intents. On share, channel and member/bot permissions are fetched again. A preview does not lock in earlier permission. Permissions may still change between checking and Discord sending; failures produce a safe message without token/text details. Restrict command access through Server Settings → Integrations if desired.

### Security, privacy and data

Command input is sent to **Discord and the bot process**; it is not hidden from Discord or the bot operator. An ephemeral response limits channel visibility, not platform access or retention. Do not submit passwords, tokens, sensitive personal information or confidential documents. After calculation, drafts store only counts, language/pace, title, owner/server/channel/message IDs and expiry. There is no forensic erasure guarantee for JavaScript memory. SDK user, member and message caches are disabled; server/channel metadata is still processed for operation. Normal logs contain readiness/error state only, not input or raw SDK/API error objects.

Public titles and counts remain in Discord. Draft expiry, discard or shutdown does not delete a published message. Ephemeral replies can also remain visible on Discord after RAM expiry. Delete your own shared message using Discord permissions; the bot has no bulk deletion command. Titles containing URLs may remain clickable despite embeds being suppressed; no link safety scan occurs. Members can copy content. See [SECURITY.md](SECURITY.md); never include tokens/private text in reports.

### Keeping the bot online and updating

Sleep, shutdown or a closed terminal takes the bot offline. For continuous operation, run one Node 24 process on your own always-on host, separate from unrelated production services. This repository does not provision hosting, auto-start services or promise uptime. Protect `.env`/host secrets and do not enable raw SDK debug logging. If the connection does not recover, fix the underlying issue and restart. To update, stop the bot, read release notes, obtain the new source, preserve `.env` privately, and run `npm ci --ignore-scripts`, `npm run check`, `npm run register`, `npm start`.

### Troubleshooting

- **Node/npm not found:** install Node 24.13+ 24.x, reopen the terminal, and use the extracted project folder.
- **Setup required:** wizard incomplete or IDs invalid/missing. `.env` belongs in the project folder; do not attach it to a report.
- **Command missing:** check app/server IDs, installation and `applications.commands` scope, successful `npm run register`, and refresh Discord. Server Integrations and Use Application Commands permissions may restrict access.
- **Login/registration failed:** use the bot token from the same app, not Client Secret. Check connectivity and installation/IDs. Rotate exposed tokens immediately.
- **Permission error:** channel role/member overwrites may deny either you or the bot. Fix only the needed permissions; do not grant Administrator. Use an ordinary text/announcement channel instead of a thread/forum/voice/DM.
- **Invalid/expired button:** five minutes elapsed, the bot restarted, another user/message owns the draft, or it was used. Run a new command. For channel sharing cooldown, wait 60 seconds.
- **Input rejected:** shorten to 4000 UTF-16 units, include a word (emoji/punctuation alone do not qualify), and remove controls from the title.
- **Mobile/screen reader:** buttons have text labels and results are plain text, but live client and assistive technology experience has not been automatically verified. Report client/version details without private input.

### Tests, contribution and license

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
```

`check` runs recommended-preset Biome lint/format, strict TypeScript including dependency types, Node tests, dependency license/registry/SHA-512/install-script checks and source credential-pattern scanning. Pattern scanning cannot detect all secrets; local `.env` is not read and must not be tracked. Tests cover word/time boundaries, privacy, concurrent single use, expiry/caps, changed permissions, forged buttons and safe unconfigured startup/setup. Discord interactions are mocked. Real token entry, installation, API operation, mobile/screen-reader behavior and always-on hosting still need operator validation. Tests need no token; this release was not run on a VDS.

GitHub CI runs on Ubuntu, Windows and macOS 15 Intel. npm install scripts are disabled; Actions permissions are only `contents: read`, with actions pinned to commit SHAs. CI also checks Bash helper syntax. Windows double-click UX is not automatically tested. See [CONTRIBUTING.md](CONTRIBUTING.md) for contributions and [LICENSE](LICENSE) for MIT terms. Dependencies retain their own licenses. No additional authorship or live verification claim is made.

### Official references / Resmî kaynaklar

- [Discord application commands](https://docs.discord.com/developers/interactions/application-commands)
- [Discord interactions and responses](https://docs.discord.com/developers/interactions/receiving-and-responding)
- [Discord message API](https://docs.discord.com/developers/resources/message)
- [Discord Gateway](https://docs.discord.com/developers/events/gateway)
- [Discord Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy)
- [Node internationalization / Intl](https://nodejs.org/api/intl.html)
