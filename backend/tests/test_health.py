from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_healthz_returns_ok():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_sports_returns_six_entries():
    response = client.get("/api/sports")
    assert response.status_code == 200
    sports = response.json()
    assert len(sports) == 6
    olympic = [s for s in sports if s["type"] == "Olympic"]
    paralympic = [s for s in sports if s["type"] == "Paralympic"]
    assert len(olympic) == 3
    assert len(paralympic) == 3


def test_get_sport_by_slug():
    response = client.get("/api/sports/curling")
    assert response.status_code == 200
    assert response.json()["name"] == "Curling"
    assert response.json()["parity_pair"] == "wheelchair-curling"


def test_get_sport_unknown_returns_404():
    response = client.get("/api/sports/quidditch")
    assert response.status_code == 404
