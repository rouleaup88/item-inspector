# item-inspector

Item Inspector is a userscript for www.wanikani.com

This repository contain the Item Inspector code and associated data files.
<br><br>
The Item Inspector script is
<br><br>
WaniKani Item Inspector.user.js
<br><br><br>
The following files are filters and a collection of functions complement Item Inspector
<br><br>
Datetime Parsing and Validation Functions.js<br>
WaniKani Open Framework Date Filters.user.js<br>
WaniKani Open Framework Search Filters.user<br>
WaniKani Open Framework Statistics Filters.user<br>
WaniKani Open Framework Kanjidic2 and Traditional Radicals Filters.user<br>
<br><br>
The following files are lzma compressed versions of mwil Keisei Semantic-Phonetic composition data bases.
<br><br>
kanji_esc.json.compressed<br>
phonetic_esc.json.compressed<br>
wk_kanji_esc.json.compressed<br>
<br>
The original files are at https://github.com/mwil/wanikani-userscripts
<br><br><br>The following files are lzma compressed versions of mwil Niai Visually Similar Kanji data bases.
<br><br>
from_keisei_esc.json.compressed<br>
manual_esc.json.compressed<br>
old_script_esc.json.compressed<br>
wk_niai_noto_esc.json.compressed<br>
yl_radical_esc.json.compressed<br>
<br>
The original files are at https://github.com/mwil/wanikani-userscripts
<br><br><br>
The following file is the lzma compressed version of Lars Yencken visually similar database - also used in Niai Visually Similar Kanji
<br><br>
stroke_edit_dist_esc.json.compressed
<br><br>
The original file is at https://github.com/mwil/wanikani-userscripts
<br><br><br>
The following file is a lzma compressed extract of Kanjidict2 data for radicals
<br><br>
kanjidic2.json.compressed
<br><br>
The original data is from http://www.edrdg.org/wiki/index.php/KANJIDIC_Project
<br><br><br>
The following file is aggregate data from various data sources for traditional radicals
<br><br>
trad_rad.json.compressed
<br><br>
The data sources are: 
<br><br>
kradfile-u from Monash University: http://ftp.monash.edu.au/pub/nihongo/
<br>
wikipedia https://en.wikipedia.org/wiki/List_of_kanji_radicals_by_stroke_count
<br>
Some stroke count from stroke order font: https://www.nihilist.org.uk/Home
<br><br><br>
The following file contains stroke count for Wanikani radicals (lzma compressed)
<br><br>
WK_radicals.json.compressed
<br><br>
The stroke count data has been manually copied from the stroke count in the Kanji Stroke Order font.
<br>
https://www.nihilist.org.uk/Home
<br><br><br>
The following file contains an extract of Jonathan Waller JPLT data for vocabulary
<br><br>
JLPT_vocab.json.compressed
<br><br><br>
The foloowing file contains rendaku information for Wanikani vocabulary items:
<br><br>
rendaku_information.user.js
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
<code>
lodash.min.js => wkof.wait_state('Wkit_lodash','Ready');<p>  
lzma.js => wkof.wait_state('Wkit_lzma','Ready');<p>
lzma.shim.js => wkof.wait_state('Wkit_lzma_shim','Ready');
</code>
<br><br>

Item Inspector and WaniKani Open Framework Kanjidic2 and Traditional Radicals Filters.user are released under either the GPLV3 or the MIT license with 
these restrictions and exceptions.

The license is GPLV3 because this script includes mwil code and database licenced under GPLV3 for Keisei Semantic-Phonetic Composition.<br>
— https://www.gnu.org/licenses/gpl-3.0.en.html

If you use @acm2010 code and/or database you work as a whole must be licensed under GPLV3 to comply with mwil license.

Code borrowed from Self Study Quiz and WKOF is licensed under MIT — http://opensource.org/licenses/MIT

You may use Item Inspector code and WaniKani Open Framework Kanjidic2 and Traditional Radicals Filters.userunder either the GPLV3 or MIT license with these restrictions.
<br>— The GPLV3 code and database borrowed from @acm2010 must remain licensed under GPLV3 in all cases.
<br>— The MIT code borrowed from Self Study Quiz and WKOF must remain licensed under MIT in all cases.

These restrictions are required because we can’t legally change the license for someone else’s code and database without their permission.

Not even if we modify their code.

The following files are under the MIT License.

Datetime Parsing and Validation Functions.js<br>
WaniKani Open Framework Date Filters.user.js<br>
WaniKani Open Framework Search Filters.user<br>
WaniKani Open Framework Statistics Filters.user<br>
<br><br><br>
The WK_radicals.json.compressed file is available under the Creative Commons Attribution-Share Alike 4.0 license. https://creativecommons.org/licenses/by-sa/4.0/

The jisho.org stroke order image is available under the Creative Commons Attribution-Share Alike 3.0 license. https://creativecommons.org/licenses/by-sa/3.0/legalcode

Lars Yencken Visual Similarity data is freely available under the Creative Commons Attribution 3.0 Unported license.

lodash.min.js, lzma.js and lzma.shim.js are available under their respective licenses. See the original site for details.

The KANJIDIC project files are released under a Creative Commons Attribution-ShareAlike Licence (V3.0) <a href="https://creativecommons.org/licenses/by-sa/3.0/">License Information</a> The Licence text can be viewed <a href="https://creativecommons.org/licenses/by-sa/3.0/legalcode">here</a>.
<br><br>
Traditional Radicals uses information from the following sources:

Wikipedia <a href="https://en.wikipedia.org/wiki/Kangxi_radical">Kangxi radical page</a>.

Available under Creative Commons Attribution-ShareAlike License;

Kradfile-u

This file is available under Creative Commons Attribution-ShareAlike Licence (V3.0). The Licence Deed can be viewed here, and the full Licence Code is here.
<br><br>
Complete licensing information for Kanjidic2 and kradfile-u is <a href="http://www.edrdg.org/edrdg/newlic.html">avalable here</a>.

The link to the original kradfile-u doesn’t work anymore. You can get this file <a href="https://github.com/jmettraux/kensaku/blob/master/data/kradfile-u">here</a>.
<br><br><br>
Jonathan Waller's JPLT data is available under the Creative Commons "BY" license. See here.
<p>
 http://www.tanos.co.uk/jlpt/sharing/
 <br><br>
 Presumably J. Waller meant this license: https://creativecommons.org/licenses/by/4.0/
 <br>
 <br><br>
 This file contains data from jameshippisley and is available inder GPL V3 or later
 
 rendaku_information_data.json.compressed
 
 The original data is from th script available here: https://community.wanikani.com/t/userscript-wanikani-rendaku-information/32660
