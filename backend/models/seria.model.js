'use strict';

const db = require('../config/db');

exports.getAll = () =>
  db.query(`
    SELECT s.*, CONCAT(a.emri,' ',a.mbiemri) AS autor_emri
    FROM Seria s
    LEFT JOIN Autoret a ON s.autor_id = a.autori_id
    ORDER BY s.seria_id DESC`).then(([rows]) => rows);

exports.getById = (id) =>
  db.query('SELECT * FROM Seria WHERE seria_id = ?', [id]).then(([rows]) => rows[0] ?? null);

exports.create = ({ emri, pershkrim, autor_id }) =>
  db.query(
    'INSERT INTO Seria (emri, pershkrim, autor_id) VALUES (?,?,?)',
    [emri, pershkrim || null, autor_id || null]
  ).then(([result]) => result.insertId);

exports.update = (id, { emri, pershkrim, autor_id }) =>
  db.query(
    'UPDATE Seria SET emri=?, pershkrim=?, autor_id=? WHERE seria_id=?',
    [emri, pershkrim || null, autor_id || null, id]
  );

exports.remove = (id) =>
  db.query('DELETE FROM Seria WHERE seria_id = ?', [id]);
