# Password Eye Toggle Hardfix

Fix hard:
- Login password input sekarang benar-benar pakai `type={showPassword ? "text" : "password"}`
- Register password input sekarang benar-benar pakai toggle mata
- Account new password/reset password sekarang benar-benar pakai toggle mata
- Sebelumnya state/icon sudah masuk, tapi input lama masih single-line `type="password"`, jadi tombol mata belum muncul.

Files:
- web/app/login/page.jsx
- web/app/register/page.jsx
- web/app/account/page.jsx
- web/app/styles.css
