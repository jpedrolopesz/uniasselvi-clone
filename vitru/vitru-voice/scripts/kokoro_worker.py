import base64
import io
import json
import sys

import numpy as np
import soundfile as sf
from kokoro import KPipeline


def send(payload):
    print(json.dumps(payload, ensure_ascii=False), flush=True)


pipeline = KPipeline(lang_code="p", device="cpu")
send({"type": "ready"})

for line in sys.stdin:
    try:
        request = json.loads(line)
        chunks = []
        for result in pipeline(
            request["text"],
            voice=request.get("voice", "pf_dora"),
            speed=float(request.get("speed", 1.0)),
        ):
            audio = result.audio
            if hasattr(audio, "detach"):
                audio = audio.detach().cpu().numpy()
            chunks.append(np.asarray(audio, dtype=np.float32))

        if not chunks:
            raise RuntimeError("Kokoro não gerou áudio")

        output = io.BytesIO()
        sf.write(output, np.concatenate(chunks), 24000, format="WAV", subtype="PCM_16")
        send({
            "id": request["id"],
            "audio": base64.b64encode(output.getvalue()).decode("ascii"),
        })
    except Exception as error:
        send({"id": request.get("id") if "request" in locals() else None, "error": str(error)})
