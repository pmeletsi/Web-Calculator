-- WebCalculator schema (mirrors EF Core migration InitialCreate).
-- Generated 2026-06-10.

IF OBJECT_ID('dbo.Calculations', 'U') IS NOT NULL DROP TABLE dbo.Calculations;
IF OBJECT_ID('dbo.Users',        'U') IS NOT NULL DROP TABLE dbo.Users;

CREATE TABLE dbo.Users (
    Id           INT           IDENTITY(1,1) NOT NULL,
    Username     NVARCHAR(50)                NOT NULL,
    PasswordHash NVARCHAR(256)               NOT NULL,
    CreatedAt    DATETIME2                   NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (Id)
);

CREATE UNIQUE INDEX IX_Users_Username ON dbo.Users (Username);

CREATE TABLE dbo.Calculations (
    Id          INT             IDENTITY(1,1) NOT NULL,
    UserId      INT                           NOT NULL,
    Username    NVARCHAR(50)                  NOT NULL,
    Expression  NVARCHAR(200)                 NOT NULL,
    Result      DECIMAL(18, 6)                NOT NULL,
    CreatedAt   DATETIME2                     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Calculations          PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_Calculations_Users    FOREIGN KEY (UserId) REFERENCES dbo.Users (Id) ON DELETE NO ACTION
);

CREATE INDEX IX_Calculations_Username ON dbo.Calculations (Username);
CREATE INDEX IX_Calculations_UserId   ON dbo.Calculations (UserId);
