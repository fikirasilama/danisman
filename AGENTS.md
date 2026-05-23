<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Danisman — Project Rules

## Proje Tanimi
KOBI'lere yonelik AI danismanlik ve Claude tabanli agent/skill hizmetleri sunan B2B platformu.

Faz 1 kapsami: Landing page + Blog + Hizmet Katalog
Stack: Next.js 16, TypeScript, Tailwind, App Router, src/ dizini

## Calisma Kurallari (HER PROMPT'TA UYGULA)

1. Her degisiklik oncesi AGENTS.md ve CLAUDE.md dosyalarini oku, self-verification yap.
2. Surgical, isolated degisiklikler yap. Genis refactor, dosya yeniden adlandirma, klasor tasima YAPMA.
3. Asla otomatik commit ETME. Cevabinin sonuna "DO NOT COMMIT" yaz.
4. UI'da gorunen metinlerde:
   - Em dash karakterini KULLANMA
   - Cift tire (--) KULLANMA
   - Tek tire (-) veya virgul kullan
5. Turkce icerik default'tur. Ingilizce metin gerekirse acikca belirt.
6. node_modules veya .next icine dokunma.
7. package.json'a yeni dependency eklemeden once sor.
8. Component'lar src/components altinda, sayfa rotalari src/app altinda, helper'lar src/lib altinda olur.
9. Inline style yerine Tailwind class kullan.
10. Her response basinda bu kurallari okudugunu kisa bir cumleyle teyit et.

## Tasarim Sistemi (Faz 1)
- Renk paleti, font, layout sistemi henuz kararlastirilmadi.
- Default olarak Tailwind'in notr scale'ini kullan (slate, neutral).
- Estetik kaygi yuksek: cookie-cutter SaaS template gorunumunden kacin.

## Yasaklar
- Hardcoded gizli anahtar (API key, token) commit etme.
- .env dosyasini git'e ekleme.
- Test/demo veriyi production'a sizdirma.
