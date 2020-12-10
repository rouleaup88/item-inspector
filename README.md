# item-inspector

Item Inspector is a userscript for www.wanikani.com

This repository contain the Item Inspector code and associated data files.
<br><br>
The Item Inspector script is
<br><br>
WaniKani Item Inspector.user.js
<br><br><br>
The following files are lzma compressed versions of mwil Keisei Semantic-Phonetic composition data bases.
<br><br>
kanji_esc.json.compressed<br>
phonetic_esc.json.compressed<br>
wk_kanji_esc.json.compressed<br>
<br>
The original files are at https://github.com/mwil/wanikani-userscripts
<br><br><br>
The following file is the lzma compressed version of Lars Yencken visually similar database
<br><br>
stroke_edit_dist_esc.json.compressed
<br><br>
The original file is at https://github.com/mwil/wanikani-userscripts
<br><br><br>
For information about lzma compression in Item Inspector see https://github.com/rouleaup88/Kanji-stroke-order
<br><br><br>
The folowing files are utility scripts adapted to be used with the wkof.load_script() function. They issue a wkof.set_state(file_id,'Ready') when they
are done executing. You may wait for them to be ready with the corresponding wkof.wait_state(file_id, 'Ready") call.
<br><br>
lodash.min.js -- the lodash utility https://lodash.com/<br>
lzma.js -- The lzma decompression utility https://github.com/jcmellado/js-lzma<br>
lzma.shim.js -- The lzma decompression utility https://github.com/jcmellado/js-lzma<br>
<br><br>
The required wkof.wait_state calls are:
<br><br>
lodash.min.js => wkof.wait_state('Wkit_lodash','Ready')<br>
lzma.js => wkof.wait_state('Wkit_lzma','Ready')<br>
lzma.shim.js => wkof.wait_state('Wkit_lzma_shim','Ready')<br>
<br><br>

Item Inspector is released under either the GPLV3 or the MIT license with these restrictions and exceptions.

The license is GPLV3 because this script includes mwil code and database licenced under GPLV3 for Keisei Semantic-Phonetic Composition.<br>
— https://www.gnu.org/licenses/gpl-3.0.en.html

If you use @acm2010 code and/or database you work as a whole must be licensed under GPLV3 to comply with mwil license.

Code borrowed from Self Study Quiz and WKOF is licensed under MIT — http://opensource.org/licenses/MIT

You may use Item Inspector code under either the GPLV3 or MIT license with these restrictions.
<br>— The GPLV3 code and database borrowed from @acm2010 must remain licensed under GPLV3 in all cases.
<br>— The MIT code borrowed from Self Study Quiz and WKOF must remain licensed under MIT in all cases.

These restrictions are required because we can’t legally change the license for someone else’s code and database without their permission.

Not even if we modify their code.

The jisho.org stroke order image are available under the Creative Commons Attribution-Share Alike 3.0 license. https://creativecommons.org/licenses/by-sa/3.0/legalcode

Lars Yencken Visual Similarity data is freely available under the Creative Commons Attribution 3.0 Unported license.

lodash.min.js, lzma.js and lzma.shim.js are available under their respective licenses. See the original site for details.
