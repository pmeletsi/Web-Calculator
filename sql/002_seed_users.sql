-- Dev users

INSERT INTO dbo.Users (Username, PasswordHash, Role)
VALUES
('evi', '$2a$11$TxRiQESIRSY0D3b2FAJaOuDezTMxrzT5c4D90KWGi5uGU8U5WyPWK', 'User');

INSERT INTO dbo.Users (Username, PasswordHash, Role)
VALUES
('nik','$2a$11$f8yQlPX0BUZ9gQdfUWnNceBArBIDaQoEkRVrseteqFlEpNSh3CxNm' , 'User');

INSERT INTO dbo.Users (Username, PasswordHash, Role)
VALUES
('admin', '$2a$11$987424720$98898787803584$34', 'Admin');