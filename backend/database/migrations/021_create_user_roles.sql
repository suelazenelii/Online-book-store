CREATE TABLE IF NOT EXISTS UserRoles (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  klient_id INT NULL,
  admin_id  INT NULL,
  rol_id    INT NOT NULL,
  FOREIGN KEY (klient_id) REFERENCES Klientet(klient_id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id)  REFERENCES Adminet(admin_id)   ON DELETE CASCADE,
  FOREIGN KEY (rol_id)    REFERENCES Roles(rol_id)       ON DELETE CASCADE,
  INDEX idx_userroles_klient (klient_id),
  INDEX idx_userroles_admin  (admin_id),
  INDEX idx_userroles_rol    (rol_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
