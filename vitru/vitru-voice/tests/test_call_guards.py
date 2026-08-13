from pipecat_app.call_guards import call_guard_reason


def test_idle_guard_closes_after_sixty_seconds():
    assert call_guard_reason(call_started_at=0, last_speech_at=10, now=70,
                             idle_seconds=60, max_seconds=600) == "idle"


def test_maximum_call_guard_closes_after_ten_minutes():
    assert call_guard_reason(call_started_at=0, last_speech_at=599, now=600,
                             idle_seconds=60, max_seconds=600) == "max_duration"


def test_active_call_is_kept_open():
    assert call_guard_reason(call_started_at=0, last_speech_at=50, now=55,
                             idle_seconds=60, max_seconds=600) is None
