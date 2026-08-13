from pipecat.frames.frames import Frame, LLMFullResponseEndFrame, LLMTextFrame, TextFrame
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

OPEN = "<thinking>"
CLOSE = "</thinking>"


class ThinkingTextFilter:
    def __init__(self):
        self.buffer = ""
        self.thinking = False

    def feed(self, text: str) -> str:
        self.buffer += text
        output = []
        while self.buffer:
            marker = CLOSE if self.thinking else OPEN
            index = self.buffer.find(marker)
            if index >= 0:
                if not self.thinking:
                    output.append(self.buffer[:index])
                self.buffer = self.buffer[index + len(marker):]
                self.thinking = not self.thinking
                continue

            keep = 0
            for size in range(1, min(len(marker) - 1, len(self.buffer)) + 1):
                if self.buffer.endswith(marker[:size]):
                    keep = size
            stable = self.buffer[:-keep] if keep else self.buffer
            if not self.thinking:
                output.append(stable)
            self.buffer = self.buffer[-keep:] if keep else ""
            break
        return "".join(output)

    def finish(self) -> str:
        output = "" if self.thinking else self.buffer
        self.buffer = ""
        self.thinking = False
        return output


class ThinkingFilterProcessor(FrameProcessor):
    def __init__(self):
        super().__init__()
        self._filter = ThinkingTextFilter()

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)
        if isinstance(frame, LLMTextFrame):
            text = self._filter.feed(frame.text)
            if text:
                await self.push_frame(LLMTextFrame(text=text))
        elif isinstance(frame, LLMFullResponseEndFrame):
            text = self._filter.finish()
            if text:
                await self.push_frame(TextFrame(text=text))
            await self.push_frame(frame, direction)
        else:
            await self.push_frame(frame, direction)
