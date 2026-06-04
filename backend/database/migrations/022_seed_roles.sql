INSERT IGNORE INTO Roles (emri, pershkrim)
VALUES ('user', 'Client user role'), ('admin', 'Administrator role');

INSERT INTO UserRoles (klient_id, admin_id, rol_id)
SELECT k.klient_id, NULL, r.rol_id
FROM Klientet k
JOIN Roles r ON r.emri = 'user'
WHERE NOT EXISTS (
  SELECT 1 FROM UserRoles ur WHERE ur.klient_id = k.klient_id AND ur.rol_id = r.rol_id
);

INSERT INTO UserRoles (klient_id, admin_id, rol_id)
SELECT NULL, a.admin_id, r.rol_id
FROM Adminet a
JOIN Roles r ON r.emri = 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM UserRoles ur WHERE ur.admin_id = a.admin_id AND ur.rol_id = r.rol_id
);
