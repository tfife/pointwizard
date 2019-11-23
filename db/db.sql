DROP TABLE member CASCADE;
DROP TABLE game CASCADE;
DROP TABLE player;

CREATE TABLE member
( member_id  SERIAL PRIMARY KEY
, username VARCHAR(80) NOT NULL UNIQUE
, password VARCHAR(80) NOT NULL
);

CREATE TABLE game
( game_id SERIAL PRIMARY KEY
, title VARCHAR(80) NOT NULL
, creator INT NOT NULL REFERENCES member(member_id) ON DELETE CASCADE
);

CREATE TABLE player
( player_id SERIAL
, player_name VARCHAR(80) NOT NULL
, game INT NOT NULL REFERENCES game(game_id) ON DELETE CASCADE
);

INSERT INTO member(username, password) VALUES ('default', 123);
INSERT INTO game(title, creator) VALUES ('My Game', 1);
INSERT INTO player(player_name, game) VALUES ('Player 1', 1), ('Player 2', 1);