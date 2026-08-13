import unittest

from pipecat_app.thinking_filter import ThinkingTextFilter


class ThinkingTextFilterTest(unittest.TestCase):
    def test_removes_closed_block_across_stream_chunks(self):
        filter_ = ThinkingTextFilter()
        spoken = "".join([
            filter_.feed("<think"),
            filter_.feed("ing>raciocínio privado</thinking> Você concluiu"),
            filter_.feed(" a AV1 com nota 8,5."),
            filter_.finish(),
        ])
        self.assertEqual(spoken, " Você concluiu a AV1 com nota 8,5.")

    def test_discards_unclosed_block(self):
        filter_ = ThinkingTextFilter()
        spoken = filter_.feed("Resposta falável. <thinking>não terminei") + filter_.finish()
        self.assertEqual(spoken, "Resposta falável. ")


if __name__ == "__main__":
    unittest.main()
