<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Danisman - Proje Kurallari

## Proje Tanimi
KOBİ'lere yönelik AI danışmanlık ve Claude tabanlı agent/skill hizmetleri sunan B2B platformu.

Faz 1 kapsamı: Landing page + Blog + Hizmet Katalog
Stack: Next.js 16, TypeScript, Tailwind, App Router, src/ dizini

## Çalışma Kuralları (HER PROMPT'TA UYGULA)

1. Her değişiklik öncesi AGENTS.md oku, self-verification yap.
2. Surgical, isolated değişiklikler yap. Geniş refactor, dosya yeniden adlandırma, klasör taşıma YAPMA.
3. Asla otomatik commit ETME. Cevabının sonuna "DO NOT COMMIT" yaz.
4. UI'da görünen metinlerde:
   - Em dash karakterini (—) KULLANMA
   - Çift tire (--) KULLANMA
   - Tek tire (-) veya virgül kullan
5. Türkçe içerik default'tur. İngilizce metin gerekirse açıkça belirt.
6. node_modules veya .next içine dokunma.
7. package.json'a yeni dependency eklemeden önce sor.
8. Component'lar src/components altında, sayfa rotaları src/app altında, helper'lar src/lib altında olur.
9. Inline style yerine Tailwind class kullan.
10. Her response başında bu kuralları okuduğunu kısa bir cümleyle teyit et.

## Tasarım Sistemi (Faz 1)
- Renk paleti, font, layout sistemi henüz kararlaştırılmadı.
- Default olarak Tailwind'in nötr scale'ini kullan (slate, neutral).
- Estetik kaygı yüksek: cookie-cutter SaaS template görünümünden kaçın.

## Yasaklar
- Hardcoded gizli anahtar (API key, token) commit etme.
- .env dosyasını git'e ekleme.
- Test/demo veriyi production'a sızdırma.
