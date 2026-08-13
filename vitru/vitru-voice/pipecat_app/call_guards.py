def call_guard_reason(*, call_started_at: float, last_speech_at: float, now: float,
                      idle_seconds: float, max_seconds: float) -> str | None:
    """Return the first deterministic limit reached by an active voice call."""
    if now - call_started_at >= max_seconds:
        return "max_duration"
    if now - last_speech_at >= idle_seconds:
        return "idle"
    return None
