import base64
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from PIL import Image, PngImagePlugin

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('create_avatar',ROOT/'scripts/create-avatar.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class AvatarTest(unittest.TestCase):
    def test_cli_roundtrip_and_metadata(self):
        with tempfile.TemporaryDirectory() as tmp:
            d=Path(tmp);src=d/'input.png';info=PngImagePlugin.PngInfo();info.add_text('private','secret')
            Image.new('RGB',(200,240),'#ffeedd').save(src,pnginfo=info)
            out=d/'result'
            proc=subprocess.run([sys.executable,str(ROOT/'scripts/create-avatar.py'),str(src),'--out',str(out)],capture_output=True,text=True)
            self.assertEqual(proc.returncode,0,proc.stderr)
            p=json.loads((out/'character.avatar.json').read_text())
            self.assertEqual(p['kind'],'raster-puppet');self.assertEqual(len(p['features']),5)
            image=Image.open(io.BytesIO(base64.b64decode(p['image'].split(',')[1])))
            self.assertEqual(image.size,(200,240));self.assertNotIn('private',image.info)
            self.assertTrue((out/'calibration.png').is_file())
            with self.assertRaises(ValueError):m.create(src,out)
    def test_boxes(self):
        for bad in [None,{}, {'leftEye':[0,0,1,1]}]:
            with self.assertRaises(ValueError):m.regions(bad)
        for box in [[0,0,-.1,.1],[float('nan'),0,.1,.1],[True,0,.1,.1],[.9,0,.2,.1]]:
            with self.assertRaises(ValueError):m.regions({**m.DEFAULT,'leftEye':box})
        with self.assertRaises(ValueError):m.regions({**m.DEFAULT,'leftEye':m.DEFAULT['rightEye']})
    def test_bad_image_leaves_no_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            d=Path(tmp);src=d/'bad.png';src.write_text('not an image')
            with self.assertRaises(OSError):m.create(src,d/'out')
            self.assertFalse((d/'out').exists())
    def test_generator_rejects_empty_calibration_and_extreme_aspect_ratio(self):
        with tempfile.TemporaryDirectory() as tmp:
            d=Path(tmp);src=d/'source.png';Image.new('RGB',(100,100)).save(src)
            for index,bad in enumerate([{}, [], False, 'bad']):
                out=d/f'bad-{index}'
                with self.assertRaises(ValueError):m.create(src,out,bad)
                self.assertFalse(out.exists())
            Image.new('RGB',(64,4096)).save(src)
            with self.assertRaisesRegex(ValueError,'aspect ratio'):m.create(src,d/'wide')
            self.assertFalse((d/'wide').exists())
    def test_custom_calibration(self):
        with tempfile.TemporaryDirectory() as tmp:
            d=Path(tmp);src=d/'source.png';Image.new('RGB',(100,100)).save(src)
            box={**m.DEFAULT,'mouth':[.4,.6,.15,.04]}
            p=m.create(src,d/'out',box);self.assertEqual(p['features']['mouth']['box'],box['mouth'])
if __name__=='__main__':unittest.main()
