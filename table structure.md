| table_name         | column_name        | data_type                |
| ------------------ | ------------------ | ------------------------ |
| api_keys           | updated_at         | timestamp with time zone |
| trades             | take_profit        | numeric                  |
| trades             | status             | USER-DEFINED             |
| trades             | pnl                | numeric                  |
| trades             | opened_at          | timestamp with time zone |
| trades             | closed_at          | timestamp with time zone |
| trades             | created_at         | timestamp with time zone |
| trades             | updated_at         | timestamp with time zone |
| trades             | trading_account_id | uuid                     |
| trading_accounts   | id                 | uuid                     |
| trading_accounts   | user_id            | uuid                     |
| trading_accounts   | initial_balance    | numeric                  |
| trading_accounts   | current_balance    | numeric                  |
| trading_accounts   | is_active          | boolean                  |
| trading_accounts   | created_at         | timestamp with time zone |
| dashboard_access   | id                 | uuid                     |
| dashboard_access   | user_id            | uuid                     |
| dashboard_access   | approved_by        | uuid                     |
| dashboard_access   | approved_at        | timestamp with time zone |
| dashboard_access   | created_at         | timestamp with time zone |
| api_keys           | created_at         | timestamp with time zone |
| profiles           | id                 | uuid                     |
| profiles           | role               | USER-DEFINED             |
| profiles           | created_at         | timestamp with time zone |
| profiles           | updated_at         | timestamp with time zone |
| mood_entries       | id                 | uuid                     |
| mood_entries       | user_id            | uuid                     |
| mood_entries       | trade_id           | uuid                     |
| mood_entries       | mood               | USER-DEFINED             |
| mood_entries       | confidence_level   | integer                  |
| mood_entries       | created_at         | timestamp with time zone |
| trading_strategies | id                 | uuid                     |
| trading_strategies | user_id            | uuid                     |
| trading_strategies | win_rate           | numeric                  |
| trading_strategies | avg_pnl            | numeric                  |
| trading_strategies | total_trades       | integer                  |
| trading_strategies | is_active          | boolean                  |
| trading_strategies | created_at         | timestamp with time zone |
| trading_strategies | updated_at         | timestamp with time zone |
| messages           | id                 | uuid                     |
| messages           | sender_id          | uuid                     |
| messages           | receiver_id        | uuid                     |
| messages           | is_read            | boolean                  |
| messages           | created_at         | timestamp with time zone |
| dashboard_requests | id                 | uuid                     |
| dashboard_requests | user_id            | uuid                     |
| dashboard_requests | status             | USER-DEFINED             |
| dashboard_requests | reviewed_by        | uuid                     |
| dashboard_requests | reviewed_at        | timestamp with time zone |
| dashboard_requests | created_at         | timestamp with time zone |
| trades             | id                 | uuid                     |
| trades             | user_id            | uuid                     |
| trades             | trade_type         | USER-DEFINED             |
| trades             | entry_price        | numeric                  |
| trades             | exit_price         | numeric                  |
| trades             | lot_size           | numeric                  |
| trades             | stop_loss          | numeric                  |
| profiles           | username           | text                     |
| profiles           | email              | text                     |
| trading_accounts   | account_name       | text                     |
| profiles           | avatar_url         | text                     |
| trading_accounts   | broker             | text                     |
| trading_accounts   | account_type       | text                     |
| dashboard_access   | status             | text                     |
| api_keys           | api_key            | text                     |
| trades             | notes              | text                     |
| messages           | subject            | text                     |
| messages           | content            | text                     |
| mood_entries       | notes              | text                     |
| trades             | pair               | text                     |
| trades             | screenshot_urls    | ARRAY                    |
| trades             | tags               | ARRAY                    |
| trading_strategies | name               | text                     |
| trading_strategies | description        | text                     |
| trading_strategies | rules              | ARRAY                    |
| api_keys           | key_type           | text                     |
| dashboard_requests | request_type       | text                     |
| dashboard_requests | reason             | text                     |