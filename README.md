# Shopizer admin, hardened

A fork of the [Shopizer Angular admin](https://github.com/shopizer-ecommerce/shopizer-admin). It pairs with [pavansky/shopizer-hardened](https://github.com/pavansky/shopizer-hardened), the fixed Shopizer 3.2.7 backend.

[![ci](https://github.com/pavansky/shopizer-admin-hardened/actions/workflows/ci.yml/badge.svg)](https://github.com/pavansky/shopizer-admin-hardened/actions/workflows/ci.yml)

## What changed

| Area | Upstream | This fork |
|---|---|---|
| Build | No lockfile. A fresh install pulls incompatible packages and `ng build --prod` fails | Lockfile committed, versions pinned for Angular 11 and TypeScript 4.0 |
| Braintree form | "Pre-authorization" sent AUTHORIZECAPTURE, "Sale" sent SALE, which is not a transaction type | Sends AUTHORIZE and AUTHORIZECAPTURE |
| Retries | Every failed request retried once, including capture and refund | Only GET is retried |
| Orders list | 1-based pager sent to a 0-based API, so page 1 skipped results | Sends `page - 1` |
| Password reset | Route named both segments `:id`, and the service hard-coded store DEFAULT | Store read from the link path |
| Runtime config | `env.js` malformed. Fallback `/api/api/v1` and French | Valid `env.js`. `/api` and English |
| Refund and capture | Generic "failed" toast | Server message shown. Refund sends an optional amount |

Every change is one commit on top of the tag `baseline-upstream`.

```bash
git log --oneline baseline-upstream..main
```

## Build and run

Requires Node 14.

```bash
npm ci --legacy-peer-deps
```

```bash
npm start
```

The admin expects the backend at `http://localhost:8080/api`. Set `APP_BASE_URL` in `src/assets/env.js`, or through `env.template.js` in containers.

## License and credit

The Shopizer admin is by the Shopizer team, under the license in [LICENSE](LICENSE). The original README is kept as [UPSTREAM-README.md](UPSTREAM-README.md). Changes in this fork are by Pavan Kumar Guthikonda.
