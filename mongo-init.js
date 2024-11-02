db.createUser({
  user: 'sshlay',
  pwd: 'sshlay_password',
  roles: [
    {
      role: 'readWrite',
      db: 'sshlay'
    }
  ]
});
