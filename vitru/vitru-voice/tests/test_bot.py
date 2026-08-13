import unittest

from pipecat_app.context import SNAPSHOT_SENTINEL, build_system_prompt, replace_page_snapshot


class ReplacePageSnapshotTest(unittest.TestCase):
    def test_system_prompt_does_not_contain_browser_context(self):
        prompt = build_system_prompt({
            "browserContext": {"page": {"pathname": "/pagina-antiga"}},
            "navigationDestinations": [{"href": "/destino-estavel"}],
        })

        self.assertNotIn("/pagina-antiga", prompt)
        self.assertNotIn("browserContext", prompt)
        self.assertIn("/destino-estavel", prompt)
        self.assertIn(SNAPSHOT_SENTINEL, prompt)

    def test_keeps_only_latest_snapshot_at_end(self):
        messages = [
            {"role": "user", "content": "pergunta"},
            {"role": "user", "content": f"{SNAPSHOT_SENTINEL} antigo 1"},
            {"role": "assistant", "content": "resposta"},
            {"role": "user", "content": f"{SNAPSHOT_SENTINEL} antigo 2"},
        ]

        updated = replace_page_snapshot(messages, {"type": "page_context", "version": 3})

        snapshots = [m for m in updated if m["content"].startswith(SNAPSHOT_SENTINEL)]
        self.assertEqual(len(snapshots), 1)
        self.assertIs(updated[-1], snapshots[0])
        self.assertIn('"version": 3', snapshots[0]["content"])


if __name__ == "__main__":
    unittest.main()
