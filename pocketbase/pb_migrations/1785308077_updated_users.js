/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "resetPasswordTemplate": {
      "body": "<p>Bonjour,</p>\n<p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe.</p>\n<p>\n  <a class=\"btn\" href=\"{APP_URL}/?reset-token={TOKEN}\" target=\"_blank\" rel=\"noopener\">Réinitialiser le mot de passe</a>\n</p>\n<p><i>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</i></p>\n<p>\n  Merci,<br/>\n  L'équipe {APP_NAME}\n</p>",
      "subject": "Réinitialisez votre mot de passe oxalapp"
    }
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "resetPasswordTemplate": {
      "body": "<p>Hello,</p>\n<p>Click on the button below to reset your password.</p>\n<p>\n  <a class=\"btn\" href=\"{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}\" target=\"_blank\" rel=\"noopener\">Reset password</a>\n</p>\n<p><i>If you didn't ask to reset your password, please ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
      "subject": "Reset your {APP_NAME} password"
    }
  }, collection)

  return app.save(collection)
})
