#!/usr/bin/env python3
"""Offline inspection only: do not import/execute third-party code or inspect secrets."""
import argparse
import ast
import hashlib
import importlib.util
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
def inspect(upstream=None):
    manifest=json.loads((ROOT/'scripts/live2d-source.json').read_text())
    vendor=Path(upstream).resolve() if upstream else None
    errors=[];count=0
    for name,digest in (manifest['files_sha256'].items() if vendor else []):
        p=vendor/name
        if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest()!=digest:
            errors.append(f'Checksum mismatch: {name}')
        elif p.suffix=='.py':
            try: ast.parse(p.read_text(),filename=name);count+=1
            except SyntaxError as e: errors.append(f'Syntax error: {name}: {e}')
    deps={name:importlib.util.find_spec(name) is not None for name in ['numpy','cv2','PIL','gradio_client','psd_tools']}
    return {'upstream_commit':manifest['commit'],'checked_files':len(manifest['files_sha256']) if vendor else 0,
            'source_supplied':bool(vendor),
            'python_files_parsed':count,'errors':errors,'dependencies_discoverable':deps,
            'upstream_executed':False,'images_uploaded':False,
            'full_build_verified':False,
            'next_requirements':['Authorize third-party code execution before running rigkit.',
                'Supply approved illustration and aligned expression variants.',
                'Supply existing layered PSD or separately configured local See-through; no automatic uploads.',
                'Supply licensed Cubism Core for runtime validation and preview.',
                'Validate output in target VTube Studio; the web app has no Cubism loader.']}
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--upstream',type=Path,help='Separately obtained pinned source tree; inspect only, never run')
    args=p.parse_args();result=inspect(args.upstream);print(json.dumps(result,indent=2));sys.exit(bool(result['errors']))
