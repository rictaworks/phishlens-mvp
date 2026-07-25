# ER図(実装反映版)

`src/api/db/schema.rb`(2026-07-25時点、#7でマージ)から起こしたER図。requirements.md 2章の設計時ER図と
一致していることを確認済み。

```mermaid
erDiagram
    USERS ||--o{ JUDGEMENTS : "実行する"
    USERS ||--|| AI_QUOTAS : "保有する"
    USERS ||--o{ FEEDBACKS : "送信する"
    JUDGEMENTS ||--o{ JUDGEMENT_REASONS : "根拠を持つ"
    JUDGEMENTS ||--o{ FEEDBACKS : "対象となる"
    JUDGEMENT_CATEGORIES ||--o{ JUDGEMENTS : "分類する"
    FEEDBACK_CATEGORIES ||--o{ FEEDBACKS : "分類する"

    USERS {
        string google_sub PK
        string display_name
        datetime created_at
    }
    AI_QUOTAS {
        string google_sub PK_FK
        date quota_date
        integer used_count "0または1"
        datetime reset_at
    }
    JUDGEMENTS {
        integer id PK
        string google_sub FK
        string body_sha256 "本文は保存しない"
        integer phishing_score "0-100"
        integer ai_gen_score "0-100 or NULL(判定不能)"
        string category_code FK
        boolean ai_detail_used
        datetime judged_at
    }
    JUDGEMENT_REASONS {
        integer id PK
        integer judgement_id FK
        string reason_code
        integer score_delta
    }
    FEEDBACKS {
        integer id PK
        integer judgement_id FK
        string google_sub FK
        string feedback_code FK
        datetime created_at
    }
    JUDGEMENT_CATEGORIES {
        string code PK
        string label
        integer threshold_min
    }
    FEEDBACK_CATEGORIES {
        string code PK
        string label
    }
    URGENCY_KEYWORDS {
        integer id PK
        string keyword
        string lang
    }
    BRAND_DOMAINS {
        integer id PK
        string brand_name
        string official_domain
    }
    SHORTENER_DOMAINS {
        integer id PK
        string domain
    }
    AI_STYLE_PATTERNS {
        integer id PK
        string pattern_code
        string description
        integer weight "10-20"
    }
```

`URGENCY_KEYWORDS` / `BRAND_DOMAINS` / `SHORTENER_DOMAINS` / `AI_STYLE_PATTERNS` はルールベース判定
(`src/api/app/services/rule_based/`)から参照されるのみで、他テーブルとの外部キー関係は持たない
(元データは `src/extension/config/masters/*.json` を単一の情報源とし、`db/seeds.rb` で読み込む)。
