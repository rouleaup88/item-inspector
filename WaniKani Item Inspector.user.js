// ==UserScript==
// @name          WaniKani Item Inspector
// @namespace     wk-dashboard-item-inspector
// @description   Inspect Items in Tabular Format
// @author        prouleau
// @version       1.12.3
// @include       https://www.wanikani.com/dashboard
// @include       https://www.wanikani.com/
// @license       GPLV3; https://www.gnu.org/licenses/gpl-3.0.en.html and MIT; http://opensource.org/licenses/MIT --- with exceptions described in comments
// @run-at        document-end
// @grant         none
// ==/UserScript==

// ===============================================================
// Software Licence
//
// The license is GPLV3 because this script includes @acm2010 code and database licenced under GPLV3 for Keisei Semantic-Phonetic Composition.
// If you use @acm2010 code and/or database you work as a whole must be licensed under GPLV3 to comply with @acm2010 license.
//
// Code borrowed from Self Study Quiz and WKOF is licensed under MIT --- http://opensource.org/licenses/MIT
//
// You may use Item Inspector code under either the GPLV3 or MIT license with these restrictions.
// --- The GPLV3 code and database borrowed from @acm2010 must remain licensed under GPLV3 in all cases.
// --- The MIT code borrowed from Self Study Quiz and WKOF must remain licensed under MIT in all cases.
// These restrictions are required because we can't legally change the license for someone else's code and database without their permission.
// Not even if we modify their code.
//
// ===============================================================

    /* globals wkof, $, ss_quiz, _, LZMA */
    /* eslint-disable no-multi-spaces */
    /* eslint-disable curly */
    /* eslint-disable no-return-assign */
    /* eslint-disable no-loop-func */


(function() {
    'use strict';

    // --------------------------------------
    // File names for resources to be loaded.

    // Prerequisite scripts
    const lodash_file = 'https://raw.githubusercontent.com/rouleaup88/item-inspector/main/lodash.min.js';
    const lzma_file = 'https://raw.githubusercontent.com/rouleaup88/item-inspector/main/lzma.js';
    const lzma_shim_file = 'https://raw.githubusercontent.com/rouleaup88/item-inspector/main/lzma.shim.js';

    // SVG images for the radicals without characters - just giving the key for storing an object in wkof cache
    const Wkit_SVGforRadicals = 'Wkit_SVGforRadicals';

    // Keisei Semantic-Phonetic Composition databases
    const kanji_db = 'https://raw.githubusercontent.com/rouleaup88/item-inspector/main/kanji_esc.json.compressed';
    const phonetic_db = 'https://raw.githubusercontent.com/rouleaup88/item-inspector/main/phonetic_esc.json.compressed';
    const wk_kanji_db = 'https://raw.githubusercontent.com/rouleaup88/item-inspector/main/wk_kanji_esc.json.compressed';

    // Lars Yencken visually similar kanji database
    const visuallySimilarFilename = 'https://raw.githubusercontent.com/rouleaup88/item-inspector/main/stroke_edit_dist_esc.json.compressed';

    // Jisho.og stroke order SVG images - prouleau lzma compressed version
    const strokeOrderFileName = 'https://raw.githubusercontent.com/rouleaup88/Kanji-stroke-order/main/WK_svg_smaller.json.compressed';

    // Scripts for optional filters
    const optionalFilters = {dateFilters: 'https://greasyfork.org/scripts/412570-wanikani-open-framework-date-filters/code/WaniKani%20Open%20Framework%20Date%20Filters.user.js',
                             statsFilters: 'https://greasyfork.org/scripts/412768-wanikani-open-framework-statistics-filters/code/WaniKani%20Open%20Framework%20Statistics%20Filters.user.js',
                             searchFilters:  'https://greasyfork.org/scripts/414665-wanikani-open-framework-search-filters/code/WaniKani%20Open%20Framework%20Search%20Filters.user.js',
                             itemList: 'https://greasyfork.org/scripts/409955-wanikani-item-list-filter-for-self-study-quiz/code/Wanikani%20Item%20List%20Filter%20(for%20Self-Study%20Quiz).user.js',
                             partOfSpeech: 'https://greasyfork.org/scripts/376095-wanikani-part-of-speech-filter/code/Wanikani%20Part-of-Speech%20Filter.user.js',
                             //visSim: 'https://greasyfork.org/scripts/377971-wanikani-open-framework-visually-similar-kanji-filter/code/Wanikani%20Open%20Framework:%20Visually%20similar%20kanji%20filter.user.js'
                             //joyoJpltFrequency: 'https://greasyfork.org/scripts/377613-wanikani-open-framework-jlpt-joyo-and-frequency-filters/code/Wanikani%20Open%20Framework%20JLPT,%20Joyo,%20and%20Frequency%20filters.user.js'
                            };


    //------------------------------
    // Wanikani Framework
    //------------------------------
    if (!window.wkof) {
        var script_name = 'Wanikani Item Inspector';
        var response = confirm(script_name + ' requires WaniKani Open Framework.\n Click "OK" to be forwarded to installation instructions.');
        if (response) {
            window.location.href = 'https://community.wanikani.com/t/instructions-installing-wanikani-open-framework/28549';
        };

        return;
    };

    var scriptId = 'Item_Inspector';
    var scriptTitle = 'Item Inspector';

    //------------------------------
    // Styling
    //
    // This is the main Item Inspector styling
    // Some styling for the settings borrowed from Self Study Quiz is in a separate function
    //------------------------------
    var fontColor;
    var secondaryFontColor;
    function table_css(){
        let is_dark = is_dark_theme();
        fontColor = (is_dark ? '#000000' : '#ffffff');
        secondaryFontColor = (is_dark ? '#212020' : 'gainsboro');
        var leechTableCss = `

            /* Settings dialog alteration */
            #wkof_ds .note:not(.error) {
                  background-color: yellow;
                  font-weight: bold;
            }

            /* SVG images for radicals */

            #WkitTopBar svg.radical {
                width: 1em;
                fill: none;
                stroke: currentColor;
                /*stroke-width: 68;*/
                stroke-width: 88;
                stroke-linecap: square;
                stroke-miterlimit: 2;
                vertical-align: middle;
            }

            /* Control Bar */

           .WkitControlBar {
                  position: relative;
                  margin: 7px 0.6% 7px 2.6%;
            }

            /* to prevent rendering problems */
            #WkitTopBar {
                  position: relative;
                  display: inline-block;
                  width: 103.2%;
                  margin-left: -27px;
                  margin-bottom: 30px;
                  padding-top: 3px;
                  padding-bottom: 3px;
                  padding-right: 3px;
                  padding-left: 3px;
             }


            #WkitTopBar .WkitSmallCaps {
                  font-family: "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
                  margin: 0px;
                  padding: 7.5px 30px;
                  background-color: #d5d5d5;
                  text-align: center;
                  border-radius: 5px 5px 0 0;
                  font-size: 11px;
                  font-weight: bold;
                  letter-spacing: 0;
                  line-height: 20px;
                  color: #555;
                  text-transform: uppercase;
                  text-shadow: 0 1px 0 #fff;
                  ${is_dark ? 'align-items: center;' : ''}
                  ${is_dark ? 'background-color: #1c1e21;' : ''}
                  ${is_dark ? 'box-shadow: 0 1px 1px rgba(0, 0, 0, 0.7), 0 2px 2px rgba(0, 0, 0, 0.7);' : ''}
                  ${is_dark ? 'color: #bcbcbc;' : ''}
                  ${is_dark ? 'display: flex;' : ''}
                  ${is_dark ? 'margin-bottom:;' : ''}
                  ${is_dark ? 'max-height: 60px;' : ''}
                  ${is_dark ? 'padding-bottom: 3px;' : ''}
                  ${is_dark ? 'padding-top: 3px;' : ''}
                  ${is_dark ? 'text-align: left;' : ''}
            }

            #WkitTopBar .WkitTableList {
                  position: relative;
                  margin: 0 0 30px;
            }

            #WkitTopBar .WkitTableList table{
                  width: 100%;
                  max-width: 100%;
                  background-color: transparent;
                  border-collapse: collapse;
                  border-spacing: 0;
            }

            #WkitTopBar .WkitTableList table,
            #WkitTopBar .right table{
                  width: 100%;
                  line-height: 1em;
                  color: ${is_dark ? '#bcbcbc' : '#fff'};
                  /*color: inherit;*/
            }

            #WkitTopBar .WkitTableList table a {
                  text-decoration: none;
            }

            #WkitTopBar .WkitTableList .WkitMainElement {
                  display: block;
                  padding: 0.7em 1em;
                  margin: 0px;
                  color: #fff;
                  text-decoration: none;
                  -webkit-transition: text-shadow ease-out 0.3s;
                  -moz-transition: text-shadow ease-out 0.3s;
                  -o-transition: text-shadow ease-out 0.3s;
                  transition: text-shadow ease-out 0.3s;
            }

            #WkitTopBar .WkitTableList table tr{
                  border-top: 0;
                  border-bottom: 0;
                  border-left: 0;
                  text-shadow: 0 1px 0 rgba(0,0,0,0.2);
            }

            #WkitTopBar .WkitTableList table td{
                  -webkit-box-sizing: border-box;
                  -moz-box-sizing: border-box;
                  box-sizing: border-box;
            }

           #WkitTopBar .WkitTableList table tr[class=vocabulary]{
                  background-color: #a100f1;
                  background-image: -moz-linear-gradient(top, #a0f, #9300dd);
                  background-image: -webkit-gradient(linear, 0 0, 0 100%, from(#a0f), to(#9300dd));
                  background-image: -webkit-linear-gradient(top, #a0f, #9300dd);
                  background-image: -o-linear-gradient(top, #a0f, #9300dd);
                  background-image: linear-gradient(to bottom, #a0f, #9300dd);
                  background-repeat: repeat-x;
                  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#FFAA00FF', endColorstr='#FF9300DD', GradientType=0);
                  border-top: 1px solid #c655ff;
                  border-bottom: 1px solid #8800cc;
                  border-left: 1px solid #c655ff;        }

            #WkitTopBar .WkitTableList table tr[class=kanji]{
                  background-color: #f100a1;
                  background-image: -moz-linear-gradient(top, #f0a, #dd0093);
                  background-image: -webkit-gradient(linear, 0 0, 0 100%, from(#f0a), to(#dd0093));
                  background-image: -webkit-linear-gradient(top, #f0a, #dd0093);
                  background-image: -o-linear-gradient(top, #f0a, #dd0093);
                  background-image: linear-gradient(to bottom, #f0a, #dd0093);
                  background-repeat: repeat-x;
                  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#FFFF00AA', endColorstr='#FFDD0093', GradientType=0);
                  border-top: 1px solid #f6c;
                  border-bottom: 1px solid #cc0088;
                  border-left: 1px solid #f6c;
            }

            #WkitTopBar .WkitTableList table tr[class=radical]{
                  background-color: #00a1f1;
                  background-image: -moz-linear-gradient(top, #0af, #0093dd);
                  background-image: -webkit-gradient(linear, 0 0, 0 100%, from(#0af), to(#0093dd));
                  background-image: -webkit-linear-gradient(top, #0af, #0093dd);
                  background-image: -o-linear-gradient(top, #0af, #0093dd);
                  background-image: linear-gradient(to bottom, #0af, #0093dd);
                  background-repeat: repeat-x;
                  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#FF00AAFF', endColorstr='#FF0093DD', GradientType=0);
                  border-top: 1px solid #88d7ff;
                  border-bottom: 1px solid #069;
                  border-left: 1px solid #88d7ff;
            }

            #WkitTopBar .WkitItemList {
                  visibility: visible;
                  position: relative;
                  background-color: #0000001a;
                  display: -webkit-flex;
                  display: flex;
                  flex-direction: row;
                  flex-wrap: wrap;
                  line-height: 1;
                  width: 96.1%;
                  margin-left: 29px;
                  margin-right: 4px;
                  padding-top: 3px;
                  padding-bottom: 3px;
                  padding-right: 3px;
                  padding-left: 3px;
                  border-radius: 5px;
            }

            #WkitTopBar .WkitItemList.WkitFlexJustified {
                  justify-content: space-between;
            }

            #WkitTopBar .WkitItemList.WkitFlexLeft {
                  justify-content: flex-start;
            }

            #WkitTopBar .WkitSmallCapsList {
                  font-family: "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
                  background-color: #cccccc;
                  text-align: center;
                  width: max-content;
                  font-weight: bold;
                  letter-spacing: 0;
                  color: #241f42;
                  text-transform: uppercase;
                  border-radius: 5px;
                  border-color: #000000;
                  border-width: 1px;
                  border-style: solid;
                  ${is_dark ? 'align-items: center;' : ''}
${is_dark ? 'background-color: #1c1e21;' : ''}
${is_dark ? 'box-shadow: 0 1px 1px rgba(0, 0, 0, 0.7), 0 2px 2px rgba(0, 0, 0, 0.7);' : ''}
${is_dark ? 'color: #bcbcbc;' : ''}
${is_dark ? 'display: flex;' : ''}
${is_dark ? 'margin-bottom:;' : ''}
${is_dark ? 'max-height: 60px;' : ''}
${is_dark ? 'padding-bottom: 3px;' : ''}
${is_dark ? 'padding-top: 3px;' : ''}
${is_dark ? 'text-align: left;' : ''}
}

            #WkitTopBar .WkitSmallCapsList.WkitReading {
                  margin-top: 2px;
                  margin-bottom: 2px;
                  margin-left: 5px;
                  margin-right: 5px;
                  line-height: 1em;
                  padding: 15px 20px;
                  font-size: 14px;
             }

            #WkitTopBar .WkitSmallCapsList.WkitMeaning {
                  margin-top: 2px;
                  margin-bottom: 2px;
                  margin-left: 5px;
                  margin-right: 5px;
                  padding: 8px 20px;
                  font-size: 12px;
             }

            #WkitTopBar .WkitTooltipIcon {
                margin: 10px 5px;
            }

            #WkitTopBar .WkitItemListed {
                display: inline-block;
                text-decoration-line: none;
            }

            #WkitTopBar .WkitItemListed span {
                border-radius: 5px;
                /*border-color: #000000;
                border-width: 1px;
                border-style: solid;*/
                color: #ffffff;
                line-height: 1em;
                padding: 6px;
                margin: 0;
                box-shadow: inset 0 -2px 0 rgba(0,0,0,0.2);
            }

            #WkitTopBar .WkitItemListed a {
                text-decoration-line: none;
            }

            #WkitTopBar .WkitMarker span {
                border-radius: 5px;
                font-size: 14px;
                line-height: 1em;
                padding: 14px 8px;
                margin: 8px;
                box-shadow: inset 0 -2px 0 rgba(0,0,0,0.2);
                background-image: linear-gradient(0deg, #c1cdc5, #b0bfb5);
                background-color: #c1cdc5;
            }

            #WkitTopBar .WkitMarkerMeaning span {
                border-radius: 5px;
                font-size: 14px;
                line-height: 1em;
                padding: 6px 6px;
                margin: 0;
                text-decoration-line: none;
                box-shadow: inset 0 -2px 0 rgba(0,0,0,0.2);
                background-image: linear-gradient(0deg, #c1cdc5, #b0bfb5);
                background-color: #c1cdc5;
            }

            #WkitTopBar .left a {
                font-size: 74px;
                line-height: 73px;
                display: block;
                border-radius: 3px;
                margin: 3px 10px 0 3px;
            }

            #WkitTopBar .item.vocabulary .left a {
                margin-right: 3px;
                text-align: center;
            }

            #WkitTopBar .WkitHeader {
                  background-color: ${is_dark ? '#232629' : '#5c6c705c'};
                  display: -webkit-flex;
                  display: flex;
                  justify-content: space-between;
                  padding: 3px;
                  width: calc(100% - 8px);
                  border-radius: 5px;
                  margin-left: -2px;
             }

            #WkitTopBar .WkitControlLeft {
                  display: block;
                  vertical-align: middle;
                  height: 100%;
                  padding-left: 2px;
            }

            #WkitTopBar .WkitControlRight {
                  display: block;
                  vertical-align: middle;
                  height: 100%;
                  padding-right: 3px;
            }

            #WkitTopBar .WkitSpacer {
                  visibility: hidden;
                  display: inline;
                  float: left;
                  width: 10px;
            }

            #WkitTopBar .WkitDialogContainer {
                  display: none; /* Hidden by default */
                  position: absolute;
                  z-index: 1;
                  right: 12px;
                  top: 63px;
                  width: 156px;
                  height: auto;
                  padding: 5px;
                  overflow: auto;
                  background-color: rgb(0,0,0);
                  border-radius: 5px;
                  border-width: 1px;
            }

            #WkitTopBar .WkitFilterContainer {
                  display: none; /* Hidden by default */
                  position: absolute;
                  z-index: 1;
                  right: 60%;
                  top: 63px;
                  width: 156px;
                  height: auto;
                  padding: 5px;
                  overflow: auto;
                  background-color: rgb(0,0,0);
                  border-radius: 5px;
                  border-width: 1px;
            }

            #WkitTopBar .WkitExportButton{
                   z-index: 1; /* Sit on top */
                   border-width: 1px;
                   border-radius: 3px;
                   text-align: center;
                   min-width: 150px;
                   width: max-content;
                   height: 30px;
                   margin: 3px;
                   color: #000000;
                   background-color: #efefef;
                   text-decoration: none;
            }

            #WkitTopBar .WkitTitle {
                   vertical-align: middle;
                   font-size: 150%;
                   text-align: center;
                   margin-top: 3px;
                   margin-bottom: 3px;
                   width: 28%;
            }

           #WkitTopBar .WkitButton {
                   display: inline;
                   float: left;
                   vertical-align: middle;
                   border-width: 1px;
                   border-radius: 3px;
                   text-align: center;
                   min-width: 30px;
                   width: max-content;
                   height: 30px;
                   margin: 2px;
                   margin-top: 5px;
                   margin-bottom: 5px;
                   font-family: FontAwesome;
            }

           #WkitTopBar .WkitButton:not(.WkitActive) {
                   background-color: #efefef;
           }

           #WkitTopBar .WkitButton.WkitActive {
                   background-color: ${is_dark ? 'green' : '#00b300'} ! important;
           }

            #WkitTopBar .WkitTooltipContent .WkitMiniButton {
                   padding-right: 3px;
                   padding-left: 3px;
                   padding-top: 3px;
                   padding-bottom: 2px;
                   margin-top: 3px;
                   font-size: 12px;
                   line-height: 1em;
            }

            #WkitTopBar .WkitButton a {
                  color: rgb(0, 0, 0);
            }

            #WkitTopBar button a {
                  color: #000000;
                  text-decoration: none;
            }

           #WkitTopBar .WkitButtonLeft {
                   float: left;
            }

            #WkitTopBar .WkitButtonRight {
                   float: right;
            }

            #WkitTopBar .WkitEnglishButton {
                   font-size: 18px;
                   font-weight: bold;
            }

            #WkitTopBar .WkitSelector {
                   display: inline;
                   float: left;
                   vertical-align: middle;
                   margin-right: 3px;
                   margin-left: 3px;
                   margin-top: 5px;
                   margin-bottom: 5px;
                   border-width: 1px;
                   border-color: Black;
                   color: Black;
                   width: 200px;
                   background-color: #efefef;
            }

            #WkitTopBar .WkitClipBoard {
                  display: inline-block;
                  width: 96%;
                  height: 420px;
                  margin-left: 29px;
             }

            #WkitTopBar .emptyMessage {
                  margin: 7px 0.6% 7px 2.6%;
                  padding: 5px;
                  padding-left: 15px;
                  padding-top: 10px;
                  background-color: Azure;
                  border-radius: 8px;
             }

            /* Pop ups, aka TOOL TIPS */

            #WkitTopBar .WkitTooltip {
                  display: inline-block;
                  position: relative;
                  padding: 0px;
            }

            #WkitTopBar .WkitTooltip .WkitTooltipContent {
                  background-color: black;
                  max-width: 700px;
                  z-index: 1;
            }

            #WkitTopBar .WkitTooltip .WkitIconTooltipContent {
                  background-color: #5f1616;
                  max-width: 235px;
                  z-index: 2;
            }

            #WkitTopBar .WkitTooltip .WkitIconTooltipContent,
            #WkitTopBar .WkitTooltip .WkitTooltipContent {
                  display: inline-block;
                  visibility: hidden;
                  color: ${is_dark ? '#bcbcbc' : '#fff'};
                  font-size: 100%;
                  width: max-content;
                  text-align: left;
                  padding: 2px;
                  border-radius: 3px;
                  position: absolute;
            }

            #WkitTopBar .WkitItemList .WkitTooltip .WkitTooltipContent > .left,
            #WkitTopBar .WkitItemList .WkitTooltip .WkitTooltipContent > .right {
                  display: block;
            }

            #WkitTopBar .WkitTableList .WkitTooltip:hover .WkitTooltipContent {
                  visibility: visible;
                  z-index: 50;
                  transition-delay: 0.1s;
            }

            #WkitTopBar .WkitTableList .WkitTooltip.WkitFirstItem:hover div.WkitTooltipContent {
                  top: 100%;
            }

            #WkitTopBar .WkitTableList .WkitTooltip.WkitLaterItem:hover div.WkitTooltipContent {
                  bottom: 100%;
            }

            #WkitTopBar .WkitTableList .WkitTooltip.WkitLeftItem .WkitTooltipContent {
                  left: 0%;
            }

            #WkitTopBar .WkitTableList .WkitTooltip.WkitRightItem .WkitTooltipContent {
                  right: calc(100% - 30px);
            }

            #WkitTopBar .WkitTableList .WkitTooltip .WkitTooltipContent::after {
                  content: " ";
                  position: absolute;
                  border-width: 5px;
                  border-style: solid;
            }

            #WkitTopBar .WkitTableList .WkitTooltip.WkitLeftItem .WkitTooltipContent::after {
                  left: 1em;
            }

            #WkitTopBar .WkitTableList .WkitTooltip.WkitRightItem .WkitTooltipContent::after {
                  right: 1em;
            }

            #WkitTopBar .WkitTableList .WkitTooltip.WkitFirstItem .WkitTooltipContent::after {
                  bottom: 100%;
                  border-color: transparent transparent black transparent;
            }

            #WkitTopBar .WkitTableList .WkitTooltip.WkitLaterItem .WkitTooltipContent::after {
                  top: 100%;
                  border-color: black transparent transparent transparent;
            }

            #WkitTopBar .WkitItemList .WkitTooltipIcon .WkitTooltipContent {
                  transition-delay: 0.1s;
            }

            #WkitTopBar .WkitItemList .WkitTooltipIcon.WkitFirstItem .WkitTooltipContent {
                  transform: translateY(calc(-45% + 8px));
            }

            #WkitTopBar .WkitItemList .WkitTooltipIcon.WkitLaterItem .WkitTooltipContent {
                  bottom: -7px;
            }

            #WkitTopBar .WkitItemList .WkitTooltipIcon.WkitLeftSide .WkitTooltipContent {
                  left: calc(100% + 5px);
            }

            #WkitTopBar .WkitItemList .WkitTooltipIcon.WkitRightSide .WkitTooltipContent {
                  right: calc(100% + 5px);
            }

            #WkitTopBar .WkitItemList .WkitTooltipIconMeaning .WkitTooltipContent {
                  transition-delay: 0.1s;
            }

            #WkitTopBar .WkitItemList .WkitTooltipIconMeaning.WkitFirstItem .WkitTooltipContent {
                  transform: translateY(calc(-40% + 4px));
            }

            #WkitTopBar .WkitItemList .WkitTooltipIconMeaning.WkitLaterItem .WkitTooltipContent {
                  bottom: -7px;
            }

            #WkitTopBar .WkitItemList .WkitTooltipIconMeaning.WkitLeftSide .WkitTooltipContent {
                  left: calc(100% + 5px);
            }

            #WkitTopBar .WkitItemList .WkitTooltipIconMeaning.WkitRightSide .WkitTooltipContent {
                  right: calc(100% + 5px);
            }

            #WkitTopBar .WkitItemList .WkitTooltipIconMeaning {
                  margin: 10px 5px;
            }

            #WkitTopBar .WkitItemList .WkitTooltip:hover div.WkitTooltipContent {
                  visibility: visible;
                  display: inline-block;
                  z-index: 50;
                  transition-delay: 0.5s;
            }

            #WkitTopBar .WkitItemList .WkitTooltip .WkitTooltipContent::after {
                  content: " ";
                  position: absolute;
                  border-width: 5px;
                  border-style: solid;
            }

            #WkitTopBar .WkitItemList .WkitTooltip.WkitFirstItem.WkitLeftSide .WkitTooltipContent::after {
                  right: 100%;
                  top: 40%;
                  border-color: transparent black transparent transparent;
            }

            #WkitTopBar .WkitItemList .WkitTooltip.WkitFirstItem.WkitRightSide .WkitTooltipContent::after {
                  left: 100%;
                  top: 40%;
                  border-color: transparent transparent transparent black;
            }

            #WkitTopBar .WkitItemList .WkitTooltip.WkitLaterItem.WkitLeftSide .WkitTooltipContent::after {
                  right: 100%;
                  bottom: 1em;
                  border-color: transparent black transparent transparent;
            }

            #WkitTopBar .WkitItemList .WkitTooltip.WkitLaterItem.WkitRightSide .WkitTooltipContent::after {
                  left: 100%;
                  bottom: 1em;
                  border-color: transparent transparent transparent black;
            }

             #WkitTopBar .WkitTooltip2 {
                  position: relative;
                  display: inline-block;
                  width: 30px;
            }

            #WkitTopBar .WkitTooltip2 .WkitEnlargedTooltip {
                  display: none;
                  visibility: hidden;
                  background-color: black;
                  color: #fff;
                  font-size: 100%;
                  width: max-content;
                  border-radius: 3px;
                  position: absolute;
                  bottom: 30px;
                  left: 0%;
                  padding: 2px;
                  z-index: 1;
            }

            #WkitTopBar .WkitTooltip2:hover div.WkitEnlargedTooltip {
                  visibility: visible;
                  display: inline-block;
                  z-index: 50;
            }

            #WkitTopBar .WkitTooltip2 .WkitEnlargedTooltip::after {
                  content: " ";
                  position: absolute;
                  top: 100%;
                  left: 1em;
                  border-width: 5px;
                  border-style: solid;
                  border-color: black transparent transparent transparent;
            }

            #WkitTopBar .WkitTooltip .radical {
                  background: #00a1f1;
            }

            #WkitTopBar .WkitTooltip .kanji {
                  background: #ff00aa;
            }

            #WkitTopBar .WkitTooltip .vocabulary {
                  background: #9800e8;
            }

            #WkitTopBar .WkitTooltip2 .radical {
                  padding: 5px;
                  background: #00a1f1;
             }

            #WkitTopBar .WkitTooltip2 .kanji {
                  padding: 5px;
                  background: #ff00aa;
            }

            #WkitTopBar .WkitTooltip2 .vocabulary {
                  padding: 5px;
                  background: #9800e8;
            }

            #WkitTopBar .WkitTooltipIcon span.radical {
                  background-image: linear-gradient(0deg, #0af, #0093dd);
                  background-color: #00a1f1;
            }

            #WkitTopBar .WkitTooltipIcon span.kanji {
                  background-image: linear-gradient(0deg, #f0a, #dd0093);
                  background-color: #ff00aa;
            }

            #WkitTopBar .WkitTooltipIcon span.vocabulary {
                  background-image: linear-gradient(0deg, #9800e89e, #7e00c2);
                  background-color: #9800e8;
            }

            #WkitTopBar .WkitItemListed {
                  font-size: 30px;
            }

            #WkitTopBar .WkitTooltipIconMeaning  .WkitItemListed {
                  font-size: 14px;
            }

            #WkitTopBar .WkitTooltipIcon .WkitMarker {
                  margin: 8px;
            }

           #WkitTopBar .WkitTooltipContent .WkitVisualDataContainer{
                  border-spacing: 7px;
           }

           #WkitTopBar .WkitKeiseiMsg {
                  padding-right: 5px;
           }

           #WkitTopBar .WkitTooltipContent .WkitMessageContainer {
                  display: table;
                  border-collapse: separate;
                  border-spacing: 7px;
           }

           #WkitTopBar .WkitTooltipContent .WkitVisualDataContainer {
                  display: block;
                  max-height: 100px;
                  overflow: auto;
                  ${is_dark ? 'color: #000000;' : 'color: #ffffff;'}
           }

           #WkitTopBar .WkitBaseDataList {
                  display: table;
                  border-collapse: separate;
           }

           #WkitTopBar .WkitMessage,
           #WkitTopBar .WkitCharacters {
                  display: table-cell;
                  vertical-align: middle;
           }

           #WkitTopBar .WkitCharacters {
                 border-radius: 5px;
           }

           #WkitTopBar .WkitMessage p,
           #WkitTopBar .WkitMessage span {
                 text-align: left;
                 font-size: 16px;
                 line-height: 1.2em;
                 padding-right: 8px;
           }

           #WkitTopBar .WkitCharacters.radical {
                  background-image: linear-gradient(0deg, #0af, #0093dd);
                  background-color: #00a1f1;
           }

           #WkitTopBar .WkitCharacters.kanji {
                  background-image: linear-gradient(0deg, #f0a, #dd0093);
                  background-color: #ff00aa;
           }

           #WkitTopBar .left .WkitCharacters span.kanji,
           #WkitTopBar .left .WkitCharacters span.radical {
                  padding: 5px 12px 5px 12px;
                  margin: 0px;
                  font-size: 35px;
           }

           #WkitTopBar .WkitCompoundData,
           #WkitTopBar .WkitItemForKeisei,
           #WkitTopBar .WkitBaseData {
                  display: table-cell;
                  white-space: nowrap;
           }

           #WkitTopBar .keiseiExplanations {
                 display: none;
                 visibility: hidden;
                 white-space: normal;
                 position: absolute;
                 left: 10px;
                 top: 125px;
                 background-color: #5f1616;
                 border-radius: 5px;
                 width: calc(100% - 47px);
                 padding: 8px;
                 z-index: 100;
           }

           #WkitTopBar .WkitVisualDataContainer .keiseiExplanations span,
           #WkitTopBar .WkitVisualDataContainer .keiseiExplanations p {
                 display: inline;
                 font-size: 16px;
                 line-height: 1.2em;
           }

           #WkitTopBar .WkitBaseData:hover .keiseiExplanations,
           #WkitTopBar .WkitCompoundData:hover .keiseiExplanations {
                 display: block;
                 visibility: visible;
           }

           #WkitTopBar .WkitCompoundData .keiseiText,
           #WkitTopBar .WkitItemForKeisei .keiseiText,
           #WkitTopBar .WkitBaseData .keiseiText {
                  line-height: 14px;
                  font-size: 14px;
                  margin: 0px;
                  padding: 2px;
           }

           #WkitTopBar .keiseiItem {
                  display: inline-block;
                  position: relative;
                  border-radius: 3px;
                  min-width: 65px;
                  margin: 0px 2px 0px 2px;
                  padding: 0px 2px 3px 2px;
           }

           /* margin to clear the room made for the scrollbar, but not on the top series */
           #WkitTopBar .WkitBaseDataList ~ .WkitBaseDataList .keiseiItem {
                  margin-top: 13px;
           }

           #WkitTopBar .WkitCompoundData .keiseiLarge,
           #WkitTopBar .WkitItemForKeisei .keiseiLarge,
           #WkitTopBar .WkitBaseData .keiseiLarge {
                 font-size: 25px;
                 line-height: 25px;
                 padding: 5px 0px 0px 0px;
                 margin: 0px;
           }

           #WkitTopBar .keiseiPhon {
                 background-image: linear-gradient(0deg, #48af1b, #348613);
                 background-color: #2bef35;
           }

           #WkitTopBar .keiseiNonPhon {
                  background-image: linear-gradient(0deg, #f51212, #d41010);
                  background-color: #d6171b;           }

           #WkitTopBar .keiseiRad {
                  background-image: linear-gradient(0deg, #0af, #0093dd);
                  background-color: #00a1f1;
           }

           #WkitTopBar .keiseiKan {
                  background-image: linear-gradient(0deg, #f0a, #dd0093);
                  background-color: #ff00aa;
           }

           #WkitTopBar .WkitTooltipContent .WkitPitchInfoContainer {
                  display: table;
                  border-collapse: separate;
                  border-spacing: 5px;
           }

           #WkitTopBar .WkitPitchInfo {
                 display: table-cell;
                 padding: 5px;
                 background-image: linear-gradient(0deg, #48af1b, #348613);
                 background-color: #2bef35;
                 border-radius: 3px;
           }

           #WkitTopBar .WkitPitchInfoReading {
                  margin-top: 3px;
                  font-weight: bolder;
           }

           #WkitTopBar .WkitCharactersPitch {
                  display: table-cell;
                  width: 100%;
                  background-image: linear-gradient(0deg, #9800e89e, #7e00c2);
                  background-color: #9800e8;
                  border-radius: 3px;
                  vertical-align: middle;
           }

           #WkitTopBar .WkitPitchInfoContainer .WkitCharactersPitch span {
                  word-break: keep-all;
                  font-size: 40px;
                  margin: 0px;
                  background-color: unset;
           }

           #WkitTopBar .WkitTooltipContent .WkitStrokeOrderContainer {
                  display: table;
                  border-collapse: separate;
                  border-spacing: 5px;
           }

           #WkitTopBar .WkitTooltipContent .WkitCharactersStrokeOrder {
                  display: table-cell;
                  vertical-align: middle;
           }

           #WkitTopBar .WkitTooltipContent .WkitCharactersStrokeOrder span {
                  font-size: 40px;
                  padding: 13px;
           }

           #WkitTopBar .WkitTooltipContent .WkitStrokeOrderImage {
                  display: table-cell;
                  background-color: #dedede;
           }

           #WkitTopBar .WkitStrokeOrderPopup {
                 visibility: hidden;
                 position: absolute;
                 bottom: 35px;
                 left: 0px;
                 width: max-content;
                 border-style: solid;
                 border-color: black;
                 border-width: 10px;
                 border-radius: 10px;
                 background-color: black;
                 z-index: 100;
           }

           #WkitTopBar .WkitLeftItem .WkitStrokeOrderPopup.vocabulary {
                 left: 0px;
                 right: unset;
           }

           #WkitTopBar .WkitCenterItem .WkitStrokeOrderPopup.vocabulary {
                 left: 50%;
                 right: unset;
                 transform: translateX(calc(-50% - 10px));
           }

           #WkitTopBar .WkitRightItem .WkitStrokeOrderPopup.vocabulary {
                 right: 0px;
                 left: unset;
           }

           #WkitTopBar .WkitTooltip .WkitTooltipContent .WkitStrokeOrderPopup span {
                 font-family: "KanjiStrokeOrders";
                 font-size: 160px;
                 line-height: 1em;
                 border-radius: 5px;
                 margin: 0px;
                 width: max-content;
                 height: max-content;
           }

           #WkitTopBar .WkitStrokeOrderHover:hover .WkitStrokeOrderPopup {
                 visibility: visible;
                 transition-delay: 0.2s;
           }

           #WkitTopBar .WkitTooltipContent > .WkitStrokeOrderHover span {
                 margin: 5px;
           }

           #WkitTopBar .left span {
                  font-size: 35px;
                  line-height: 40px;
                  display: block;
                  align-items: center;
                  text-align: center;
                  border-radius: 3px;
                  padding: 5px;
           }

          #WkitTopBar .WkitEnlargedTooltip span {
                  font-size: 60px;
                  line-height: 58px;
                  display: block;
                  border-radius: 3px;
                  margin: 5px;
           }

           #WkitTopBar .right  {
                  padding-left: 7px;
                  padding-right: 7px;
                  padding-bottom: 7px;
           }

           #WkitTopBar .right table td:first-child {
                  padding-right: 10px;
                  font-weight: bold;
                  width: max-content;
           }

          #WkitTopBar .WkitMiniContainer {
                  display: block;
                  position: relative;
          }

          #WkitTopBar .WkitMiniIcon {
                  position: relative;
                  display: inline-block;
                  font-size: 14px;
                  vertical-align: middle;
                  text-align:center;
                  margin: 2px;
                  height: fit-content;
                  width: max-content;
                  padding: 3px;
                  border-radius: 3px;
                  -webkit-text-size-adjust: none;
                  text-size-adjust: none;
          }

          #WkitTopBar .WkitMiniIcon .radical {
                  background: #00a1f1;
          }

          #WkitTopBar .WkitMiniIcon .kanji {
                  background: #ff00aa;
          }

          #WkitTopBar .WkitMiniIcon .vocabulary {
                  background: #9800e8;
          }

          #WkitTopBar .WkitIconTooltipContent {
                 height: fit-content;
          }

          #WkitTopBar .WkitIconTooltipContent span {
                 margin: 5px;
          }

          #WkitTopBar .WkitMiniIcon:hover .WkitIconTooltipContent {
                  visibility: visible;
                  z-index: 50;
                  transition-delay: 0.15s;
          }

          #WkitTopBar .WkitMiniIcon:hover .WkitIconTooltipContent {
                  right: calc(100% + 5px);
                  top: 50%;
                  transform: translateY(calc(-50% - 5px));
          }

          #WkitTopBar .WkitMiniIcon .WkitIconTooltipContent::after {
                  content: ' ';
                  position: absolute;
                  left: 100%;
                  top: 50%;
                  border-style: solid;
                  border-width: 5px;
                  border-color: transparent transparent transparent #fff;
                  /*border-color: transparent transparent transparent #5f1616;*/
          }

          #WkitTopBar .WkitAndMore {
                  display: inline-block;
                  position: relative;
          }

          #WkitTopBar .WkitAndMorePopup .WkitMiniIcon {
                  position: unset;
          }

          #WkitTopBar .WkitAndMorePopup {
                  display: block;
                  visibility: hidden;
                  position: absolute;
                  right: 20%;
                  transform: translateY(-50%);
                  background-color: #463838;
                  border-radius: 5px;
                  padding: 5px;
                  width: 450px;
                  transition-delay: 0.1s;
                  z-index: 150;
          }

          #WkitTopBar .WkitAndMore:hover .WkitAndMorePopup{
                  visibility: visible;
          }

          #WkitTopBar .WkitAndMore .WkitAndMorePopup::after {
                  left: 100%;
                  top: 50%;
                  border-color: tranparent #463838 transparent transparent;
          }

          #WkitTopBar .WkitMnemonicContainer {
                  position: relative;
          }

          #WkitTopBar .WkitMnemonic {
                  display: inline-block;
                  background-color: #463838;
                  border-radius: 3px;
                  padding: 2px;
                  margin: 0px 2px;
          }

          #WkitTopBar .WkitMnemonicPopup {
                  visibility: hidden;
                  position: absolute;
                  bottom: 100%;
                  left: 0%;
                  background-color: #5f1616;
                  border-radius: 5px;
                  max-height: 205px;
                  overflow: auto;
                  padding: 5px 8px;
                  z-index: 200;
                  transition-delay: 0.2s;
          }

          #WkitTopBar .WkitMnemonic:hover .WkitMnemonicPopup {
                  visibility: visible;
                  transition-delay: 0.2s;
          }

          #WkitTopBar .WkitMnemonic .WkitMnemonicPopup:after {
                  top: 100%;
                  border-style: solid;
                  border-width: 3px;
                  border-color: transparent transparent grey transparent;
          }

          #WkitTopBar .WkitIconWarning {
                 margin: auto;
                 font-weight: bold;
          }

           #WkitTopBar .right table td {
                 padding-top: 3px;
                 width: 100%;
           }

           #WkitTopBar .WkitLabel, {
                  padding: 4px;
           }

          /* css adapted from acm2010 for Keisei Semantic-phonetic composition */

          #WkitTopBar .badge-perfect:before {
                  content: "天";
                  background-color: #092;
          }

          #WkitTopBar .badge-high:before {
                  content: "上";
                  background-color: #092;
          }

          #WkitTopBar .badge-middle:before {
                  content: "中";
                  background-color: #f04;
          }

          #WkitTopBar .badge-low:before {
                 content: "下";
                 background-color: #f04;
          }

          #WkitTopBar .WkitBadge:before {
                 display:block;
                 position:absolute;
                 top:-0.3em;
                 left:-0.3em;
                 width:2em;
                 height:2em;
                 color:#fff;
                 font-size:11px;
                 font-weight:normal;
                 line-height:2.2em;
                 text-align: center;
                 text-shadow:0 2px 0 #99001f;
                 -webkit-box-shadow:0 -2px 0 rgba(0,0,0,0.2) inset,0 0 10px rgba(255,255,255,0.5);
                 -moz-box-shadow:0 -2px 0 rgba(0,0,0,0.2) inset,0 0 10px rgba(255,255,255,0.5);
                 box-shadow:0 -2px 0 rgba(0,0,0,0.2) inset,0 0 10px rgba(255,255,255,0.5);
                 -webkit-border-radius:50%;
                 -moz-border-radius:50%;
                 border-radius:50%;
                 z-index:50;
           }`

        var leechStyling = document.createElement('style');
        leechStyling.type='text/css';
        if(leechStyling.styleSheet){
            leechStyling.styleSheet.cssText = leechTableCss;
        }else{
            leechStyling.appendChild(document.createTextNode(leechTableCss));
        }
        $('head').append(leechStyling);
    };

    //------------------------------
    // Menu
    //------------------------------
    var settings_dialog;

    function install_menu() {
        wkof.Menu.insert_script_link({
            script_id: scriptId,
            name: scriptId,
            submenu:   'Settings',
            title:     'Item Inspector',
            on_click:  open_quiz_settings
        });
    }


    //########################################################################
    // SETTINGS DIALOG
    //
    // Here is a long series of functions borrowed from Self Study Quiz and heavily modified
    // for the needs of Item Inspector
    //
    // this whole series of functions is under the MIT license ; http://opensource.org/licenses/MIT
    // because this is the original license of Self Study Quiz
    //
    // These functions are for the settings dialog, initializing the settings in memory and setting up default values of settings
    //########################################################################

    //########################################################################
    // QUIZ DATA
    //
    // this is a legacy from code borrowed from Self Study Quiz
    // this is too central to Item Inspector to change
    // quiz.items is the list of items in the current table
    // quiz.settings_dialog is the settings dialog
    // quiz.settings is a shortcut to the settings (not initialized here)
    //########################################################################

    var quiz = {
        // Dialogs
        dialog: null,
        settings_dialog: null,
    };


    //========================================================================
    // setting up the settings dialog
    //------------------------------------------------------------------------
    var standardInfo = ['table_data', 'sort1', 'sort2', 'tooltip1', 'tooltip2', 'tooltip3', 'tooltip4', 'tooltip5', 'tooltip6', 'tooltip7', 'tooltip8',];
    var exportedInfo = ['export1','export2','export3','export4','export5','export6','export7','export8','export9','export10',
                        'export11','export12','export13','export14','export15','export16','export17','export18','export19','export20',
                        'export21','export22','export23','export24','export25','export26','export27','export28','export29','export30',
                        'export31','export32','export33','export34','export35','export36','export37','export38','export39','export40',
                        'export41','export42','export43','export44','export45','export46','export47','export48','export49','export50',
                        'export51','export52','export53','export54','export55',];
    var wideElements = {'Last_Review_Date':true, 'Review_Date':true, 'Passed_Date':true, 'Burned_Date':true, 'Resurrected_Date':true, 'Lesson_Date':true,
                        'Unlock_Date':true, };

    function setup_quiz_settings() {

        let tableElementContents = {'Meaning_Brief':'Meaning Brief',
                                    'Reading_Brief':'Reading Brief', 'Reading_Full':'Reading Full', 'Leech':'Leech Value',
                                    'Meaning_Correct_Answers': 'Meaning Correct Answers', 'Meaning_Incorrect_Answers': 'Meaning Incorrect Answers',
                                    'Reading_Correct_Answers': 'Reading Correct Answers', 'Reading_Incorrect_Answers': 'Reading Incorrect Answers',
                                    'Total_Correct_Answers': 'Total Correct Answers','Total_Incorrect_Answers': 'Total Incorrect Answers',
                                    'Percentage_Correct': 'Percentage Correct Total','Meaning_Correct': 'Percentage Correct Meaning',
                                    'Reading_Correct': 'Percentage Correct Reading',
                                    'Percentage_Incorrect': 'Percentage Incorrect Total','Meaning_Incorrect': 'Percentage Incorrect Meaning',
                                    'Reading_Incorrect': 'Percentage Incorrect Reading',
                                    'Meaning_Current_Streak' : 'Meaning Current Streak', 'Reading_Current_Streak': 'Reading Current Streak',
                                    'Minimum_Current_Streak': 'Minimum Current Streak' ,
                                    'Meaning_Max_Streak' : 'Meaning Maximum Streak', 'Reading_Max_Streak': 'Reading Maximum Streak', 'Review_Count': 'Number of Reviews',
                                    'Level':'Level',
                                    'Srs':'SRS Stage', 'Last_Review_Date':'Last Review Date', 'Review_Date':'Next Review Date', 'Review_Wait':'Next Review Wait Time',
                                    'Passed_Date':'Passed Guru Date', 'Burned_Date':'Burned Date', 'Resurrected_Date': 'Resurrected Date',
                                    'Lesson_Date':'Lesson Date', 'Unlock_Date': 'Unlock Date',
                                    'Joyo': 'Joyo Grade', 'JLPT': 'JLPT Level', 'Frequency': 'Frequency', };

        let dataElementContents = {'None':'None', 'Meaning_Brief':'Meaning Brief', 'Meaning_Full':'Meaning Full',
                                   'Reading_Brief':'Reading Brief', 'Reading_Full':'Reading Full', 'Reading_by_Type': 'Reading by Type (on kun)', 'Leech':'Leech Value',
                                   'Meaning_Correct_Answers': 'Meaning Correct Answers', 'Reading_Correct_Answers': 'Reading Correct Answers',
                                   'Meaning_Incorrect_Answers': 'Meaning Incorrect Answers', 'Reading_Incorrect_Answers': 'Reading Incorrect Answers',
                                   'Total_Correct_Answers': 'Total Correct Answers','Total_Incorrect_Answers': 'Total Incorrect Answers',
                                   'Percentage_Correct': 'Percentage Correct Total','Meaning_Correct': 'Percentage Correct Meaning',
                                   'Reading_Correct': 'Percentage Correct Reading',
                                   'Percentage_Incorrect': 'Percentage Incorrect Total','Meaning_Incorrect': 'Percentage Incorrect Meaning',
                                   'Reading_Incorrect': 'Percentage Incorrect Reading',
                                   'Meaning_Current_Streak' : 'Meaning Current Streak', 'Reading_Current_Streak': 'Reading Current Streak',
                                   'Minimum_Current_Streak': 'Minimum Current Streak' ,
                                   'Meaning_Max_Streak' : 'Meaning Maximum Streak', 'Reading_Max_Streak': 'Reading Maximum Streak', 'Review_Count': 'Number of Reviews',
                                   'Level':'Level',
                                   'Srs':'SRS Stage', 'Last_Review_Date':'Last Review Date', 'Review_Date':'Review Date', 'Review_Wait':'Review Wait Time',
                                   'Passed_Date':'Passed Guru Date', 'Burned_Date':'Burned Date', 'Resurrected_Date': 'Resurrected Date',
                                   'Lesson_Date':'Lesson Date', 'Unlock_Date': 'Unlock Date',
                                   'Allow_List': 'Allow List', 'Block_List': 'Block List',
                                   'Part_Of_Speech': 'Part of Speech', 'Vis_Sim_Kanji': 'WK Visually Similar Kanji', 'Lars_Yencken': 'LY Visually Similar Kanji',
                                   'Components': 'Components of Item', 'Used_In': 'Items Where Used',
                                   'Joyo': 'Joyo Grade', 'JLPT': 'JLPT Level', 'Frequency': 'Frequency',
                                   'Mnemonics': 'Mnemonics/Hints/Contxt Sent.', 'Notes': 'Notes and User Synonyms',
                                  };

        let sortElementContents = {'Default':'Default', 'Type':'Item Type (Rad, Kan, Voc)', 'Meaning_Brief':'Meaning Brief', 'Meaning_Full':'Meaning Full',
                                   'Reading_Brief':'Reading Brief', 'Reading_Full':'Reading Full', 'Leech':'Leech Value',
                                   'Meaning_Correct_Answers': 'Meaning Correct Answers', 'Reading_Correct_Answers': 'Reading Correct Answers',
                                   'Meaning_Incorrect_Answers': 'Meaning Incorrect Answers', 'Reading_Incorrect_Answers': 'Reading Incorrect Answers',
                                   'Total_Correct_Answers': 'Total Correct Answers','Total_Incorrect_Answers': 'Total Incorrect Answers',
                                   'Percentage_Correct': 'Percentage Correct Total','Meaning_Correct': 'Percentage Correct Meaning',
                                   'Reading_Correct': 'Percentage Correct Reading',
                                   'Percentage_Incorrect': 'Percentage Incorrect Total','Meaning_Incorrect': 'Percentage Incorrect Meaning',
                                   'Reading_Incorrect': 'Percentage Incorrect Reading',
                                   'Meaning_Current_Streak' : 'Meaning Current Streak', 'Reading_Current_Streak': 'Reading Current Streak',
                                   'Minimum_Current_Streak': 'Minimum Current Streak' ,
                                   'Meaning_Max_Streak' : 'Meaning Maximum Streak', 'Reading_Max_Streak': 'Reading Maximum Streak', 'Review_Count': 'Number of Reviews',
                                   'Level':'Level',
                                   'Srs':'SRS Stage', 'Last_Review_Date':'Last Review Date', 'Review_Date':'Review Date', 'Review_Wait':'Review Wait Time',
                                   'Passed_Date':'Passed Guru Date', 'Burned_Date':'Burned Date', 'Resurrected_Date': 'Resurrected Date',
                                   'Lesson_Date':'Lesson Date', 'Unlock_Date': 'Unlock Date',
                                   'Joyo': 'Joyo Grade', 'JLPT': 'JLPT Level', 'Frequency': 'Frequency', };

        let wordCloudContents = {'No Repeat': 'Don\'t Repeat', 'Leech':'Leech Value',
                                 'Meaning_Correct_Answers': 'Meaning Correct Answers', 'Reading_Correct_Answers': 'Reading Correct Answers',
                                 'Meaning_Incorrect_Answers': 'Meaning Incorrect Answers', 'Reading_Incorrect_Answers': 'Reading Incorrect Answers',
                                 'Total_Correct_Answers': 'Total Correct Answers','Total_Incorrect_Answers': 'Total Incorrect Answers',
                                 'Percentage_Correct': 'Percentage Correct Total','Meaning_Correct': 'Percentage Correct Meaning',
                                 'Reading_Correct': 'Percentage Correct Reading',
                                 'Percentage_Incorrect': 'Percentage Incorrect Total','Meaning_Incorrect': 'Percentage Incorrect Meaning',
                                 'Reading_Incorrect': 'Percentage Incorrect Reading',
                                 'Meaning_Current_Streak' : 'Meaning Current Streak', 'Reading_Current_Streak': 'Reading Current Streak',
                                 'Minimum_Current_Streak': 'Minimum Current Streak' ,
                                 'Meaning_Max_Streak' : 'Meaning Maximum Streak', 'Reading_Max_Streak': 'Reading Maximum Streak', 'Review_Count': 'Number of Reviews',
                                };

        let exportElementContents = {'None': 'Not Exported', 'Item':'Item', 'Type':'Item Type (Rad, Kan, Voc)', 'Export_Date': 'Export Date',
                                     'Meaning_Brief':'Meaning Brief', 'Meaning_Full':'Meaning Full',
                                     'Reading_Brief':'Reading Brief', 'Reading_Full':'Reading Full', 'Reading_by_Type': 'Reading by Type (on kun)', 'Leech':'Leech Value',
                                     'Meaning_Correct_Answers': 'Meaning Correct Answers', 'Meaning_Incorrect_Answers': 'Meaning Incorrect Answers',
                                     'Reading_Correct_Answers': 'Reading Correct Answers', 'Reading_Incorrect_Answers': 'Reading Incorrect Answers',
                                     'Total_Correct_Answers': 'Total Correct Answers','Total_Incorrect_Answers': 'Total Incorrect Answers',
                                     'Percentage_Correct': 'Percentage Correct Total','Meaning_Correct': 'Percentage Correct Meaning',
                                     'Reading_Correct': 'Percentage Correct Reading',
                                     'Percentage_Incorrect': 'Percentage Incorrect Total','Meaning_Incorrect': 'Percentage Incorrect Meaning',
                                     'Reading_Incorrect': 'Percentage Incorrect Reading',
                                     'Meaning_Current_Streak' : 'Meaning Current Streak', 'Reading_Current_Streak': 'Reading Current Streak',
                                     'Minimum_Current_Streak': 'Minimum Current Streak' ,
                                     'Meaning_Max_Streak' : 'Meaning Maximum Streak', 'Reading_Max_Streak': 'Reading Maximum Streak', 'Review_Count': 'Number of Reviews',
                                     'Level':'Level',
                                     'Srs':'SRS Stage', 'Last_Review_Date':'Last Review Date', 'Review_Date':'Review Date',
                                     'Passed_Date':'Passed Guru Date', 'Burned_Date':'Burned Date', 'Resurrected_Date': 'Resurrected Date',
                                     'Lesson_Date':'Lesson Date', 'Unlock_Date': 'Unlock Date',
                                     'Allow_List': 'Allow List', 'Block_List': 'Block List',
                                     'Part_Of_Speech': 'Part of Speech', 'Vis_Sim_Kanji': 'WK Visually Similar Kanji', 'Lars_Yencken': 'LY Visually Similar Kanji',
                                     'Components': 'Components of Item', 'Used_In': 'Items Where Used', 'Item_Page': 'URL of Item Page',
                                     'Joyo': 'Joyo Grade', 'JLPT': 'JLPT Level', 'Frequency': 'Frequency',
                                     'mMnemonics' : 'Meaning Mnemonics', 'rMnemonics' : 'Reading Mnemonics', 'mHints' : 'Meaning Hints', 'rHints' : 'Reading Hints',
                                     'Context_Sentences': 'Context Sentences', 'mNotes' : 'Meaning Notes', 'rNotes' : 'Reading Notes', 'Synonyms': 'User Synonyms',
                                    };

        var exportTabConfig = {type:'page',label:'Export',hover_tip:'Define the exported items of your table',
                               content:{
                                   sect_tbl_xformat:{type:'section',label:'Export Format'},
                                   separator: {type:'dropdown',label:'Cell Separator',hover_tip:'The characters that separates the cells in a row', default:'\t',
                                               path:'@tablePresets[@active_ipreset].separator', content:{',' : 'Comma', ';': 'Semicolon', '\t': 'Horizontal Tab'},
                                              },
                                   quotes: {type:'dropdown',label:'Use of Quotes',
                                            hover_tip:'Whether cells are included in quotes.\nSome data like mnemonics, hints, context sentences\nand notes will always require quotes.', default:'Never',
                                            path:'@tablePresets[@active_ipreset].quotes', content:{'As_Needed' : 'Only When Needed', 'Never': 'Never Use Quotes', 'Always': 'Always Use Quotes'},
                                           },
                                   sect_tbl_format:{type:'section',label:'Data Format'},
                                   includeTitle: {type: 'checkbox', label:'Include a Title Line', default: false, hover_tip: 'Adds a title line before the exported items',
                                                  path:'@tablePresets[@active_ipreset].includeTitle', },
                                   includeLabels: {type: 'checkbox', label:'Include a Label in Cells', default: false,
                                                   hover_tip: 'Adds in each cell a label to describe the data.\nLabels are not added to Meanings, Readings, Item,\nItem Type, Context Sentences and URL columns',
                                                   path:'@tablePresets[@active_ipreset].includeLabels', },
                                   URLclickable: {type: 'dropdown', label:'URL Clickable', default: 'Plain', hover_tip: 'Makes URL automatically clickable in spreadsheet and Anki',
                                                  path:'@tablePresets[@active_ipreset].URLclickable',content:{'Plain': 'Plain URL, Non Clickable', 'Spreadsheet': 'Spreadsheet Format', 'html': 'HTML for Anki'}, },
                                   missingData: {type: 'dropdown', label:'Missing Data', default: 'Code_Word', hover_tip: 'How to export missing data',
                                                 path:'@tablePresets[@active_ipreset].missingData', content:{'Code_Word' : 'Mark as Unavailable', 'Empty_Cell': 'Leave the Cell Empty',}},
                                   hoursInDate: {type: 'list', multi: true, size: 4, label:'Adding Hours in Dates', default: {'Review_Date': true, 'Last_Review_Date': true,}, hover_tip: 'Adding hours and minutes to selected dates.\nUnselected means just the date will be exported.',
                                                 path:'@tablePresets[@active_ipreset].hoursInDate', content:{'Review_Date':'Review Date', 'Last_Review_Date':'Last Review Date', 'Passed_Date':'Passed Guru Date', 'Burned_Date':'Burned Date',
                                                                                                             'Resurrected_Date': 'Resurrected Date', 'Lesson_Date':'Lesson Date', 'Unlock_Date': 'Unlock Date',
                                                                                                             'Export_Date': 'Export Date',}},
                                   contextSentences: {type: 'dropdown', label:'Context Sentences Format', default: 'separateJP',
                                                      hover_tip:'How the context sentences are to be exported.',
                                                      path:'@tablePresets[@active_ipreset].contextSentences',
                                                      content:{'separateJP': 'Separate Rows JP First', 'separateEN': 'Separate Rows EN First',
                                                               'sameJP': 'Same Row JP First', 'sameEN': 'Same Row EN First',
                                                               }},
                                   sect_tbl_export:{type:'section',label:'Exported Columns'},
                                   export1: {type:'dropdown',label:'Exported Column no 1',hover_tip:'The 1st column of exported information', default:'None',
                                             path:'@tablePresets[@active_ipreset].export1', content:exportElementContents,
                                            },
                                   export2: {type:'dropdown',label:'Exported Column no 2',hover_tip:'The 2nd column of exported information', default:'None',
                                             path:'@tablePresets[@active_ipreset].export2', content:exportElementContents,
                                            },
                                   export3: {type:'dropdown',label:'Exported Column no 3',hover_tip:'The 3rd column of exported information', default:'None',
                                             path:'@tablePresets[@active_ipreset].export3', content:exportElementContents,
                                            },
                                   export4: {type:'dropdown',label:'Exported Column no 4',hover_tip:'The 4th column of exported information', default:'None',
                                             path:'@tablePresets[@active_ipreset].export4', content:exportElementContents,
                                            },
                                   export5: {type:'dropdown',label:'Exported Column no 5',hover_tip:'The 5th column of exported information', default:'None',
                                             path:'@tablePresets[@active_ipreset].export5', content:exportElementContents,
                                            },
                                   export6: {type:'dropdown',label:'Exported Column no 6',hover_tip:'The 6th column of exported information', default:'None',
                                             path:'@tablePresets[@active_ipreset].export6', content:exportElementContents,
                                            },
                                   export7: {type:'dropdown',label:'Exported Column no 7',hover_tip:'The 7th column of exported information', default:'None',
                                             path:'@tablePresets[@active_ipreset].export7', content:exportElementContents,
                                            },
                                   export8: {type:'dropdown',label:'Exported Column no 8',hover_tip:'The 8th column of exported information', default:'None',
                                             path:'@tablePresets[@active_ipreset].export8', content:exportElementContents,
                                            },
                                   export9: {type:'dropdown',label:'Exported Column no 9',hover_tip:'The 9th column of exported information', default:'None',
                                             path:'@tablePresets[@active_ipreset].export9', content:exportElementContents,
                                            },
                                   export10: {type:'dropdown',label:'Exported Column no 10',hover_tip:'The 10th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export10', content:exportElementContents,
                                             },
                                   export11: {type:'dropdown',label:'Exported Column no 11',hover_tip:'The 11th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export11', content:exportElementContents,
                                             },
                                   export12: {type:'dropdown',label:'Exported Column no 12',hover_tip:'The 12th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export12', content:exportElementContents,
                                             },
                                   export13: {type:'dropdown',label:'Exported Column no 13',hover_tip:'The 13th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export13', content:exportElementContents,
                                             },
                                   export14: {type:'dropdown',label:'Exported Column no 14',hover_tip:'The 14th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export14', content:exportElementContents,
                                             },
                                   export15: {type:'dropdown',label:'Exported Column no 15',hover_tip:'The 15th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export15', content:exportElementContents,
                                             },
                                   export16: {type:'dropdown',label:'Exported Column no 16',hover_tip:'The 16th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export16', content:exportElementContents,
                                             },
                                   export17: {type:'dropdown',label:'Exported Column no 17',hover_tip:'The 17th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export17', content:exportElementContents,
                                             },
                                   export18: {type:'dropdown',label:'Exported Column no 18',hover_tip:'The 18th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export18', content:exportElementContents,
                                             },
                                   export19: {type:'dropdown',label:'Exported Column no 19',hover_tip:'The 19th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export19', content:exportElementContents,
                                             },
                                   export20: {type:'dropdown',label:'Exported Column no 20',hover_tip:'The 20th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export20', content:exportElementContents,
                                             },
                                   export21: {type:'dropdown',label:'Exported Column no 21',hover_tip:'The 21th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export21', content:exportElementContents,
                                             },
                                   export22: {type:'dropdown',label:'Exported Column no 22',hover_tip:'The 22th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export22', content:exportElementContents,
                                             },
                                   export23: {type:'dropdown',label:'Exported Column no 23',hover_tip:'The 23th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export23', content:exportElementContents,
                                             },
                                   export24: {type:'dropdown',label:'Exported Column no 24',hover_tip:'The 24th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export24', content:exportElementContents,
                                             },
                                   export25: {type:'dropdown',label:'Exported Column no 25',hover_tip:'The 25th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export25', content:exportElementContents,
                                             },
                                   export26: {type:'dropdown',label:'Exported Column no 26',hover_tip:'The 26th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export26', content:exportElementContents,
                                             },
                                   export27: {type:'dropdown',label:'Exported Column no 27',hover_tip:'The 27th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export27', content:exportElementContents,
                                             },
                                   export28: {type:'dropdown',label:'Exported Column no 28',hover_tip:'The 28th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export28', content:exportElementContents,
                                             },
                                   export29: {type:'dropdown',label:'Exported Column no 29',hover_tip:'The 29th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export29', content:exportElementContents,
                                             },
                                   export30: {type:'dropdown',label:'Exported Column no 30',hover_tip:'The 30th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export30', content:exportElementContents,
                                             },
                                   export31: {type:'dropdown',label:'Exported Column no 31',hover_tip:'The 31th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export31', content:exportElementContents,
                                             },
                                   export32: {type:'dropdown',label:'Exported Column no 32',hover_tip:'The 32th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export32', content:exportElementContents,
                                             },
                                   export33: {type:'dropdown',label:'Exported Column no 33',hover_tip:'The 33th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export33', content:exportElementContents,
                                             },
                                   export34: {type:'dropdown',label:'Exported Column no 34',hover_tip:'The 34th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export34', content:exportElementContents,
                                             },
                                   export35: {type:'dropdown',label:'Exported Column no 35',hover_tip:'The 35th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export35', content:exportElementContents,
                                             },
                                   export36: {type:'dropdown',label:'Exported Column no 36',hover_tip:'The 36th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export36', content:exportElementContents,
                                             },
                                   export37: {type:'dropdown',label:'Exported Column no 37',hover_tip:'The 37th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export37', content:exportElementContents,
                                             },
                                   export38: {type:'dropdown',label:'Exported Column no 38',hover_tip:'The 38th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export38', content:exportElementContents,
                                             },
                                   export39: {type:'dropdown',label:'Exported Column no 39',hover_tip:'The 39th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export39', content:exportElementContents,
                                             },
                                   export40: {type:'dropdown',label:'Exported Column no 40',hover_tip:'The 40th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export40', content:exportElementContents,
                                             },
                                   export41: {type:'dropdown',label:'Exported Column no 41',hover_tip:'The 41st column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export41', content:exportElementContents,
                                             },
                                   export42: {type:'dropdown',label:'Exported Column no 42',hover_tip:'The 42nd column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export42', content:exportElementContents,
                                             },
                                   export43: {type:'dropdown',label:'Exported Column no 43',hover_tip:'The 43th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export43', content:exportElementContents,
                                             },
                                   export44: {type:'dropdown',label:'Exported Column no 44',hover_tip:'The 44th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export44', content:exportElementContents,
                                             },
                                   export45: {type:'dropdown',label:'Exported Column no 45',hover_tip:'The 45th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export45', content:exportElementContents,
                                             },
                                   export46: {type:'dropdown',label:'Exported Column no 46',hover_tip:'The 46th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export46', content:exportElementContents,
                                             },
                                   export47: {type:'dropdown',label:'Exported Column no 47',hover_tip:'The 47th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export47', content:exportElementContents,
                                             },
                                   export48: {type:'dropdown',label:'Exported Column no 48',hover_tip:'The 48th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export48', content:exportElementContents,
                                             },
                                   export49: {type:'dropdown',label:'Exported Column no 49',hover_tip:'The 49th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export49', content:exportElementContents,
                                             },
                                   export50: {type:'dropdown',label:'Exported Column no 50',hover_tip:'The 50th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export50', content:exportElementContents,
                                             },
                                   export51: {type:'dropdown',label:'Exported Column no 51',hover_tip:'The 51st column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export51', content:exportElementContents,
                                             },
                                   export52: {type:'dropdown',label:'Exported Column no 52',hover_tip:'The 52nd column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export52', content:exportElementContents,
                                             },
                                   export53: {type:'dropdown',label:'Exported Column no 53',hover_tip:'The 53rd column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export53', content:exportElementContents,
                                             },
                                   export54: {type:'dropdown',label:'Exported Column no 54',hover_tip:'The 54th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export54', content:exportElementContents,
                                             },
                                   export55: {type:'dropdown',label:'Exported Column no 55',hover_tip:'The 55th column of exported information', default:'None',
                                              path:'@tablePresets[@active_ipreset].export55', content:exportElementContents,
                                             },
                               },
                              };

        var contentsTabConfig = {type:'page',label:'Contents',hover_tip:'Define the contents of your table',
                                 content:{
                                     sect_tbl_cnts:{type:'section',label:'Table Entry'},
                                     table_data: {type:'dropdown',label:'Table Data Element',hover_tip:'The data that will be displayed on the table.',
                                                  path:'@tablePresets[@active_ipreset].table_data',
                                                  content:tableElementContents,
                                                 },
                                     sort1: {type:'dropdown',label:'Primary Sort Criterion',hover_tip:'Items will be sorted by this criterion.',
                                             path:'@tablePresets[@active_ipreset].sort1',
                                             content:sortElementContents,
                                            },
                                     sortOrder1: {type:'dropdown',label:'Primary Sort Order',hover_tip:'Items will be sorted in this order.',
                                                  path:'@tablePresets[@active_ipreset].sortOrder1',
                                                  content:{'Default': 'Default', 'Ascending': 'Ascending', 'Descending': 'Descending',},
                                                 },
                                     sort2: {type:'dropdown',label:'Secondary Sort Criterion',hover_tip:'Items will be sorted by this criterion when the primary criterion is of equal values.',
                                             path:'@tablePresets[@active_ipreset].sort2',
                                             content:sortElementContents,
                                            },
                                     sortOrder2: {type:'dropdown',label:'Secondary Sort Order',hover_tip:'Items will be sorted in this order when the primary criterion is of equal values.',
                                                  path:'@tablePresets[@active_ipreset].sortOrder2',
                                                  content:{'Default': 'Default', 'Ascending': 'Ascending', 'Descending': 'Descending',},
                                                 },
                                     displayMeaning: {type: 'checkbox', label:'Show Items by Their Meanings', hover_tip:'Display the items by their English meanings',
                                                      path:'@tablePresets[@active_ipreset].displayMeaning', default: false, },
                                     sect_tbl_tooltips:{type:'section',label:'Table Popups'},
                                     tooltip1: {type:'dropdown',label:'First Popup Element',hover_tip:'The first line of data that will be displayed on the popup.',
                                                path:'@tablePresets[@active_ipreset].tooltip1', default:'None',
                                                content:dataElementContents,
                                               },
                                     tooltip2: {type:'dropdown',label:'Second Popup Element',hover_tip:'The second line of data that will be displayed on the popup.',
                                                path:'@tablePresets[@active_ipreset].tooltip2', default:'None',
                                                content:dataElementContents,
                                               },
                                     tooltip3: {type:'dropdown',label:'Third Popup Element',hover_tip:'The third line of  data that will be displayed on the popup.',
                                                path:'@tablePresets[@active_ipreset].tooltip3', default:'None',
                                                content:dataElementContents,
                                               },
                                     tooltip4: {type:'dropdown',label:'Fourth Popup Element',hover_tip:'The fourth line of  data that will be displayed on the popup.',
                                                path:'@tablePresets[@active_ipreset].tooltip4', default:'None',
                                                content:dataElementContents,
                                               },
                                     tooltip5: {type:'dropdown',label:'Fifth Popup Element',hover_tip:'The fifth line of  data that will be displayed on the popup.',
                                                path:'@tablePresets[@active_ipreset].tooltip5', default:'None',
                                                content:dataElementContents,
                                               },
                                     tooltip6: {type:'dropdown',label:'Sixth Popup Element',hover_tip:'The sixth line of  data that will be displayed on the popup.',
                                                path:'@tablePresets[@active_ipreset].tooltip6', default:'None',
                                                content:dataElementContents,
                                               },
                                     tooltip7: {type:'dropdown',label:'Seventh Popup Element',hover_tip:'The seventh line of  data that will be displayed on the popup.',
                                                path:'@tablePresets[@active_ipreset].tooltip7', default:'None',
                                                content:dataElementContents,
                                               },
                                     tooltip8: {type:'dropdown',label:'Eight Popup Element',hover_tip:'The eight line of  data that will be displayed on the popup.',
                                                path:'@tablePresets[@active_ipreset].tooltip8', default:'None',
                                                content:dataElementContents,
                                               },
                                     sect_tbl_Graphical:{type:'section',label:'Graphical Information'},
                                     showStrokeOrder: {type: 'checkbox', label:'Show Stroke Order Popups', hover_tip:'Show stroke order in popups when\nmoving the mouse over kanji and vocabulary.',
                                                   path:'@tablePresets[@active_ipreset].showStrokeOrder', default: true, },
                                     showRadical: {type: 'dropdown', label:'Radical Visual Information', hover_tip:'The visual information for radical popups.',
                                                   path:'@tablePresets[@active_ipreset].showRadical', default: 'Keisei',
                                                   content: {'Item': 'Item Only', 'Keisei': 'Keisei Semantic-Phonetic Composition'}},
                                     showKanji: {type: 'dropdown', label:'Kanji Visual Information', hover_tip:'The visual information for kanji popups.',
                                                   path:'@tablePresets[@active_ipreset].showKanji', default: 'Keisei',
                                                   content: {'Item': 'Item Only', 'Keisei': 'Keisei Semantic-Phonetic Composition', 'Stroke Order': 'Stroke Order Image'}},
                                     showVocabulary: {type: 'dropdown', label:'Vocabulary Visual Information', hover_tip:'The visual information for vocabulary popups.',
                                                   path:'@tablePresets[@active_ipreset].showVocabulary', default: 'Pitch Info',
                                                   content: {'Item': 'Item Only', 'Pitch Info': 'Pitch Info'}},
                                     sect_tbl_settings:{type:'section',label:'Other Settings'},
                                     enlargingTooltip: {type: 'checkbox', label:'Popup for Enlarged Items', hover_tip:'Adds a popup in tables at the right of the item to show an enlarged version of the item',
                                                        path:'@tablePresets[@active_ipreset].enlargingTooltip', default: false, },
                                     showMarkers: {type: 'checkbox', label:'Show Markers', hover_tip:'Show the markers for the table data in list of icons.',
                                                   path:'@tablePresets[@active_ipreset].showMarkers', default: true, },
                                     showMarkersDate: {type: 'checkbox', label:'Show Markers in Date Selection', hover_tip:'Show the markers for the table data in list of icons when ordered by date.',
                                                   path:'@tablePresets[@active_ipreset].showMarkersDate', default: false, },
                                     showHours: {type: 'checkbox', label:'Show Hours in Markers', hover_tip:'Show the hours and minutes for dates in list of icons markers',
                                                 path:'@tablePresets[@active_ipreset].showHours', default: false, },
                                     leechStreakLimit: {type:'number',label:'Leech Streak Limit',hover_tip:'Do not display an item when current streak for both meaning and reading is equal or greater to this limit.\nA value of 0 disable this feature',
                                                        path:'@tablePresets[@active_ipreset].leechStreakLimit', default:0
                                                       },
                                     visSimTreshold: {type:'number',label:'Visual Similarity Treshold',hover_tip:'Treshold for visual similarity of kanji\naccording to Lars Yencken data.\nA real number between 0 and 1\n0 selects all similar kanji.\nHigher numbers selects fewer kanjis.',
                                                        path:'@tablePresets[@active_ipreset].visSimTreshold', default:0
                                                       },
                                     sect_tbl_selections:{type:'section',label:'Selection Options Settings'},
                                     randomSelection: {type:'number',label:'Random Selection',hover_tip:'The size of a random selection of items.\n0 means to fill the screen.',
                                                       path:'@tablePresets[@active_ipreset].randomSelection', default:0,},
                                     oncePerReviewPeriod: {type: 'checkbox', label: 'Only Once Before Next Review', default: false,
                                                           hover_tip: 'In a random selection, an item may be\nselected at most once before the next review.',
                                                           path:'@tablePresets[@active_ipreset].oncePerReviewPeriod',},
                                     addSimilarItems: {type: 'checkbox', label: 'Add Similar Items', default: false,
                                                       hover_tip: 'In a random selection, a selected item is\naccompanied by at most three similar items.',
                                                       path:'@tablePresets[@active_ipreset].addSimilarItems',},
                                     navigationDate: {type:'dropdown',label:'Date for Date Navigation',hover_tip:'The date used as a reference when the mode ordering by date is on.',
                                                      path:'@tablePresets[@active_ipreset].navigationDate', default:'Lesson_Date',
                                                      content:{'Review_Date':'Review Date', 'Last_Review_Date':'Last Review Date', 'Lesson_Date':'Lesson Date', 'Passed_Date':'Passed Guru Date',
                                                               'Burned_Date':'Burned Date', 'Resurrected_Date': 'Resurrected Date', 'Unlock_Date': 'Unlock Date',},
                                               },
                                 },
                                };

        var optipnalFiltersHoverTip = 'Add more filters to your settings.\n\nWarning: These odditional filters will show up\nin disorder in Self Study Quiz settings.\nIt may be hard to locate filters in Self Study Quiz.';
        var settingsTabConfig ={type:'page',label:'Settings',
                                content:{
                                    sect_tbl_cnts:{type:'section',label:'Interface Configuration'},
                                    position: {type: 'dropdown', label: 'Position', default: 2, hover_tip: 'Where on the dashboard to install Item Inspector',
                                               content: {0: "Top", 1: "Below forecast", 2: "Below SRS", 3: "Below panels", 4: "Bottom"},
                                              },
                                    hoursFormat: {type:'dropdown',label:'Hours Format',hover_tip:'Choose the format for displaying hours',content:{'12hours':'12h', '24hours':'24h',},
                                                  default: '24h',},
                                    listMode: {type: 'checkbox', label:'Display as List', hover_tip:'Display the table as a list of icons',
                                               default: false, },
                                    numberOfLines: {type:'dropdown',label:'Number of Lines',hover_tip:'The number of lines that will be displayed in a table.', default:11,
                                                    content:{8:"8", 9:"9", 10:"10", 11:"11", 12:"12", 13:"13", 14:"14", 15:"15",},
                                                   },
                                    audioSource: {type:'dropdown',label:'Source of Audio',hover_tip:'Which audio is played in audio mode.', default:'random',
                                                  content:{'male': 'Male, Kenichi','female': 'Female, Kyoko', 'random': 'Random',},
                                                 },
                                    sect_tbl_cnts3:{type:'section',label:'Feature Selection'},
                                    restoreMissingDefaults: {type: 'button', label: ' ', text: 'Restore Missing Defaults', on_click: restoreMissingDefaults,
                                                             hover_tip: 'Checks your tables and temporary filters.\nRecreates any defaults that are missing.\n'+
                                                                        'Doesn\'t change existing defaults that\nhave been user modified.'},
                                    dividerForDefaults: {type: 'divider'},
                                    enableFeatures: {type: 'list', multi: true, label: 'Enable Features', hover_tip: 'Enable the features you want.', size: 4,
                                                      default: {englishMode: true, audioMode: true, randomSelection: true,
                                                                dateOrdering: true, temporaryFilters: true, exportCSV: true,
                                                                itemExport: true, selfStudy: true,},
                                                      content: {englishMode: 'English to Japanese Mode', audioMode: 'Audio Mode', randomSelection: 'Random Selection',
                                                                dateOrdering: 'Date ordering', temporaryFilters: 'Temporary Filters', exportCSV: 'Export to csv (Excel, Anki, Kitsun)',
                                                                itemExport: 'Item Export (Word Cloud)', selfStudy: 'Self Study Quiz',}},
                                    optionalFilters: {type: 'list', multi: true, label: 'Optional Filters', hover_tip: optipnalFiltersHoverTip, size: 4,
                                                      validate: warnAboutRefresh,
                                                      default: {dateFilters: false, searchFilters: false, statsFilters: false, itemList: false, partOfSpeech: false,},
                                                      content: {dateFilters: 'Dates and Events', searchFilters: 'Searches', statsFilters: 'Statistics',
                                                                itemList: 'Item List', partOfSpeech: 'Part Of Speech', }},
                                    deleteFilesFromCache: {type: 'button', label: ' ', text: 'Empty the Filters Cache', on_click: deleteFilesFromCache,
                                                           hover_tip: 'Deletes the versions of the filters stored in cache.\nThis will force loading new versions afresh.\n'+
                                                                      'You need to refresh your browser for\nthis action to take effect.',},
                                    sect_tbl_cnts2:{type:'section',label:'Items Export Options'},
                                    noLatin: {type: 'checkbox', label:'No Latin Characters', default: false, hover_tip:'Radicals with latin characters not exported if set',},
                                    oneItemPerLine: {type: 'checkbox', label:'One Item Per Line', default: false, hover_tip: 'One item per line if set\nAll items in one paragraph otherwise',},
                                    exportLimit: {type: 'number', label:'Export Limit', default: 0, hover_tip: 'Maximum number of items exported\n0 means no limit',},
                                    repeatWordCloud: {type: 'dropdown', label:'Repeat for Word Cloud', default: 'No Repeat', hover_tip: 'Repeat the items according this number',
                                                      content:wordCloudContents,},
                                }
                               }

        var config = {
            script_id: scriptId,
            title: 'Item Inspector',
            pre_open: preopen_quiz_settings,
            on_save: save_quiz_settings,
            on_close: close_quiz_settings,
            on_refresh: refresh_quiz_settings,
            no_bkgd: true,
            settings: {pgSettings: settingsTabConfig,
                       pg_items: {type:'page',label:'Tables',hover_tip:'Choose the table for which you want to define the settings',
                                  content:{
                                      grp_ipre_list: {type:'group',label:'Table List',content:{
                                          active_ipreset: {type:'list',refresh_on_change:true,hover_tip:'Choose a table to edit',content:{}},
                                      }},
                                      grp_ipre: {type:'group',label:'Selected Table',
                                                 content:{
                                                     sect_ipre_name: {type:'section',label:'Table Name'},
                                                     ipre_name: {type:'text',label:'Edit Table Name',on_change:refresh_ipresets,refresh_on_change:true,
                                                                 path:'@ipresets[@active_ipreset].name',hover_tip:'Enter a name for the selected table'},

                                                     sect_ipre_srcs: {type:'section',label:'Table Settings'},
                                                     ipre_srcs: {type:'tabset',
                                                                 content:{table_contents: contentsTabConfig, table_export: exportTabConfig},
                                                                }
                                                 },
                                                }
                                  },
                                 },
                       pg_filters: {type:'page',label:'Temporary Filters',hover_tip:'Choose the temporary filter set for which you want to define the settings',
                                  content:{
                                      grp_fpre_list: {type:'group',label:'Filter Set List',content:{
                                          active_fpreset: {type:'list',refresh_on_change:true,hover_tip:'Choose a filter set to edit',content:{}},
                                      }},
                                      grp_fpre: {type:'group',label:'Selected Filter Set',
                                                 content:{
                                                     sect_fpre_name: {type:'section',label:'Filter Set Name'},
                                                     fpre_name: {type:'text',label:'Edit Filter Set Name', on_change: refresh_fpresets,refresh_on_change:true,
                                                                 path:'@fpresets[@active_fpreset].name',hover_tip:'Enter a name for the selected filter set.'},
                                                     fpre_ask: {type:'checkbox',label:'Ask Before Filtering ', default: false, on_change: noTemporaryFilterAsk,
                                                                path:'@fpresets[@active_fpreset].ask',hover_tip:'Ask for the filter parameters\nbefore filtering.'},

                                                     sect_fpre_srcs: {type:'section',label:'Filter Set Settings'},
                                                     fpre_srcs: {type:'tabset', content:{},
                                                                }
                                                 },
                                                }
                                  }},
                      }};

        populate_items_config(config);

        quiz.settings_dialog = new wkof.Settings(config);
    };

    function warnAboutRefresh(){
        return {valid:true, msg: 'You need to refresh your browser for this change to take effect.'};
    }

    function noTemporaryFilterAsk(){
        if ($('#Item_Inspector_active_fpreset').prop('selectedIndex') === 0) $('#Item_Inspector_fpre_ask').prop('checked', false);
    }

    //========================================================================
    // pre_open callback for the dialog
    // adds buttons and event handlers for managing table and temporary filters
    // adds event handlers for the filters
    //------------------------------------------------------------------------
    function preopen_quiz_settings(dialog) {
        var btn_grp =
            '<div class="pre_list_btn_grp">'+
            '<button type="button" ref="###" action="new" class="ui-button ui-corner-all ui-widget" title="Create a new table">New</button>'+
            '<button type="button" ref="###" action="up" class="ui-button ui-corner-all ui-widget" title="Move the selected table up in the list"><span class="icon-arrow-up"></span></button>'+
            '<button type="button" ref="###" action="down" class="ui-button ui-corner-all ui-widget" title="Move the selected table down in the list"><span class="icon-arrow-down"></span></button>'+
            '<button type="button" ref="###" action="delete" class="ui-button ui-corner-all ui-widget" title="Delete the selected table">Delete</button>'+
            '</div>';

        var wrap = dialog.find('#Item_Inspector_active_ipreset').closest('.row');
        wrap.addClass('pre_list_wrap');
        wrap.prepend(btn_grp.replace(/###/g, 'ipreset'));
        wrap.find('.pre_list_btn_grp').on('click', 'button', preset_button_pressed);

        wrap = dialog.find('#Item_Inspector_active_fpreset').closest('.row');
        wrap.addClass('pre_list_wrap');
        wrap.prepend(btn_grp.replace(/###/g, 'fpreset'));
        wrap.find('.pre_list_btn_grp').on('click', 'button', preset_button_pressed);

        $('#Item_Inspector_ipre_srcs .row:first-child').each(function(i,e){
            var row = $(e);
            var right = row.find('>.right');
            row.prepend(right);
            row.addClass('src_enable');
        });

        $('#Item_Inspector_fpre_srcs .row:first-child').each(function(i,e){
            var row = $(e);
            var right = row.find('>.right');
            row.prepend(right);
            row.addClass('src_enable');
        });

        // Customize the item source filters.
        var srcs = $('#Item_Inspector_ipre_srcs');
        var flt_grps = srcs.find('.wkof_group');
        flt_grps.addClass('filters');
        var filters = flt_grps.find('.row');
        filters.prepend('<div class="enable"><input type="checkbox"></div>');
        filters.on('change', '.enable input[type="checkbox"]', toggle_filter);

        // Customize the temporary filters.
        srcs = $('#Item_Inspector_fpre_srcs');
        flt_grps = srcs.find('.wkof_group');
        flt_grps.addClass('filters');
        filters = flt_grps.find('.row');
        filters.prepend('<div class="enable"><input type="checkbox"></div>');
        filters.on('change', '.enable input[type="checkbox"]', toggle_filter);

        refresh_ipresets();
        refresh_fpresets();
    }

    //========================================================================
    // open_quiz_settings()
    //------------------------------------------------------------------------
    var old_position;
    function open_quiz_settings() {
        document.getElementById("WkitSettings").blur();
        old_position = quiz.settings.position;
        if (quiz.settings_dialog === undefined || quiz.settings_dialog === null){setup_quiz_settings();};
        wkof.wait_state(Wkit_navigation, 'Ready')
            .then(function(){quiz.settings_dialog.open();});

    };

    //========================================================================
    // save_quiz_settings()
    //------------------------------------------------------------------------
    function save_quiz_settings(settings) {
        quiz.settings = settings;
        populate_presets($('#Item_Inspector_source'), settings.ipresets, settings.active_ipreset);

        table_defaults.showStrokeOrder = settings.tablePresets.reduce(((acc, preset) => acc || preset.showStrokeOrder), false);
        initCurrentItem();
        setNumberOfLines();
        populateDropdown();
        setButtonsVisibility();
        if (old_position != quiz.settings.position){
            if (document.getElementById("WkitTopBar")){
                $('#WkitTopBar').empty();
                $('#WkitTopBar').remove();
                insertContainer();
                eventHandlers();
            };
        };

        quiz.settings.audioMode = false;
        formatControlBar();
        resetTemporaryFilters();
        wkof.set_state(Wkit_navigation, 'Pending');
        wkof.Settings.save(scriptId).then(function(){wkof.set_state(Wkit_navigation, 'Ready')});
        dataReload('table');
     }

    //========================================================================
    // close_quiz_settings()
    //------------------------------------------------------------------------
    function close_quiz_settings(settings) {
        quiz.settings = wkof.settings[scriptId]; // working around an obscure bug
    }

    //========================================================================
    // refresh_quiz_settings()
    //------------------------------------------------------------------------
    function refresh_quiz_settings(settings) {
        $('#Item_Inspector_ipre_srcs .wkof_group .row').each(performRefresh);
        $('#Item_Inspector_fpre_srcs .wkof_group .row').each(performRefresh);
        let preset = quiz.settings.fpresets[0];
        if (quiz.settings.active_fpreset === 0){
            var name = noTemporaryFilterName;
            preset.name = name;
            $('#Item_Inspector_fpre_name').val(name);
            preset.ask = false;
            $('#Item_Inspector_fpre_ask').val(false);
        }

       function performRefresh(i,e){
            var row = $(e);
            var panel = row.closest('[role="tabpanel"]');
            var source = panel.attr('id').match(/^Item_Inspector_pg_(.*)$/)[1];
            var name = row.find('.setting').attr('name');
            var filter_name = name.slice((source+'_iflt_').length);
            if (name.charAt(source.length + 1) === 'i') {
                var preset = quiz.settings.ipresets[quiz.settings.active_ipreset].content;
            } else {
                preset = quiz.settings.fpresets[quiz.settings.active_fpreset].content;
            }
            var enabled = false;
            try {
                enabled = preset[source].filters[filter_name].enabled;
            } catch(e) {}

            if (enabled) {
                row.addClass('checked');
            } else {
                row.removeClass('checked');
            }
            row.find('.enable input[type="checkbox"]').prop('checked', enabled);
        };
    }

    //========================================================================
    // refresh_ipresets()
    //------------------------------------------------------------------------
    function refresh_ipresets() {
        var settings = quiz.settings;
        populate_presets($('#Item_Inspector_active_ipreset'), settings.ipresets, settings.active_ipreset);
    }

    //========================================================================
    // refresh_fpresets()
    //------------------------------------------------------------------------
    function refresh_fpresets() {
        var settings = quiz.settings;
        populate_presets($('#Item_Inspector_active_fpreset'), settings.fpresets, settings.active_fpreset);
    }

    //========================================================================
    // event handlers for the buttons managing tables and temporary filters
    //------------------------------------------------------------------------
    function preset_button_pressed(e) {
        var settings = quiz.settings;
        var tablePresets = settings.tablePresets;
        var ref = e.currentTarget.attributes.ref.value;
        var action = e.currentTarget.attributes.action.value;
        var selected = Number(settings['active_'+ref]);
        var presets = settings[ref+'s'];
        var elem = $('#Item_Inspector_active_'+ref);

        var dflt = {name:'<untitled>', content:$.extend(true, {}, ipreset_defaults, ipre_defaults)};

        switch (action) {
            case 'new':
                if (ref === 'ipreset'){
                    presets.push($.extend(true, {}, dflt));
                    tablePresets.push($.extend(true, {}, table_defaults));
                    settings.tablePresets = tablePresets;
                } else if (ref === 'fpreset') {
                    presets.push($.extend(true, {}, fpreset_defaults, dflt));
                }
                selected = presets.length - 1;
                settings[ref+'s'] = presets;
                settings['active_'+ref] = selected;
                populate_presets(elem, presets, selected);
                quiz.settings_dialog.refresh();
                $('#Item_Inspector_'+ref.slice(0,4)+'_name').focus().select();
                break;

            case 'up':
                if (selected <= 0) break;
                presets = [].concat(presets.slice(0, selected-1), presets[selected], presets[selected-1], presets.slice(selected+1));
                if (ref === 'ipreset'){
                    tablePresets = [].concat(tablePresets.slice(0, selected-1), tablePresets[selected], tablePresets[selected-1], tablePresets.slice(selected+1));
                    settings.tablePresets = tablePresets;
                }
                selected--;
                settings[ref+'s'] = presets;
                settings['active_'+ref] = selected;
                populate_presets(elem, presets, selected);
                break;

            case 'down':
                if (selected === 0 && ref === 'fpreset') break;
                if (selected >= presets.length-1) break;
                presets = [].concat(presets.slice(0, selected), presets[selected+1], presets[selected], presets.slice(selected+2));
                if (ref === 'ipreset'){
                    tablePresets = [].concat(tablePresets.slice(0, selected), tablePresets[selected+1], tablePresets[selected], tablePresets.slice(selected+2));
                    settings.tablePresets = tablePresets;
                }
                selected++;
                settings[ref+'s'] = presets;
                settings['active_'+ref] = selected;
                populate_presets(elem, presets, selected);
                break;

            case 'delete':
                if (selected === 0 && ref === 'fpreset') break;
                presets = presets.slice(0, selected).concat(presets.slice(selected+1));
                if (presets.length === 0) presets = [$.extend(true, {}, dflt)];
                if (ref === 'ipreset'){
                    tablePresets = tablePresets.slice(0, selected).concat(tablePresets.slice(selected+1));
                    if (tablePresets.length === 0) tablePresets = [$.extend(true, {}, table_defaults)];
                    settings.tablePresets = tablePresets;
                }
                selected = Math.max(0, selected-1);
                settings[ref+'s'] = presets;
                settings['active_'+ref] = selected;
                populate_presets(elem, presets, selected);
                quiz.settings_dialog.refresh();
                break;
        }
    }

    function addTable(name){
        var settings = quiz.settings;
        var tablePresets = settings.tablePresets;
        var selected;
        var presets = settings.ipresets;
        var dflt = {name:name, content:$.extend(true, {}, ipre_defaults)};

        presets.push($.extend(true, {}, dflt));
        tablePresets.push($.extend(true, {}, table_defaults));
        selected = presets.length - 1;
        let keys = Object.keys(settings.defaults);
        for (var index in keys){
            let key = keys[index]
            tablePresets[selected][key] = settings.defaults[key];
        };
        settings.ipresets = presets;
        settings.active_ipreset = selected;
        settings.tablePresets = tablePresets;
        populateDropdown();
    };

    function removeTempTables(){
        var settings = quiz.settings;
        var tablePresets = settings.tablePresets;
        var presets = settings.ipresets;
        var selected = settings.active_ipreset;

        for (var j = presets.length - 1; j >=0; j--){
            if (presets[j].name.slice(0, 6) === '--Temp') deleteTable(j);
        };
        settings.ipresets = presets;
        settings.tablePresets = tablePresets;
        settings.active_ipreset = selected
        populateDropdown();

        function deleteTable(j){
            presets = presets.slice(0, j).concat(presets.slice(j+1));
            tablePresets = tablePresets.slice(0, j).concat(tablePresets.slice(j+1));
            if (selected >= j){selected--};
        };
    };

    var noTemporaryFilterName = 'No Temporary Filter';
    var restoreMissingDefaults, lackDefaults;
    //========================================================================
    // initializes settings in memory, setting up defaults at the same time
    //------------------------------------------------------------------------
    var table_defaults;
    var fpreset_defaults, ipreset_defaults;
    function init_settings() {

        prepare_defaults_for_filters();

        // Merge some defaults
        var defaults = {hoursFormat: '24h', position: 2, numberOfLines: 11, listMode: false, audioSource: 'random', audioMode: false,
                        optionalFilters: {dateFilters: false, searchFilters: false, statsFilters: false, itemList: false, partOfSpeech: false,},
                        enableFeatures: {englishMode: true, audioMode: true, randomSelection: true, dateOrdering: true, temporaryFilters: true, exportCSV: true,
                                          itemExport: true, selfStudy: true},
                        noLatin: false, oneItemPerLine: false, exportLimit: 0, repeatWordCloud: 'No Repeat',
/*                        defaults: {table_data: 'Level', sort1: 'Level', sortOrder1: 'Default', sort2: 'Default', sortOrder2: 'Default',
                                   tooltip1: 'Meaning_Full', tooltip2: 'Reading_Full', tooltip3: 'Srs', tooltip4: 'Unlock_Date', tooltip5: 'Lesson_Date',
                                   tooltip6: 'Passed_Date', tooltip7: 'Burned_Date', tooltip8: 'Leech',
                                   showStrokeOrder:true, showRadical: 'Keisei', showKanji: 'Keisei', showVocabulary: 'Pitch Info',
                                   displayMeaning: false, enlargingTooltip: false, showMarkers: true, showMarkersDate: false, showHours: false,
                                   leechStreakLimit: 0, randomSelection: 0, oncePerReviewPeriod: false ,addSimilarItems: false, navigationDate: 'Lesson_Date',
                                   separator: '\t', quotes: 'Never', includeTitle: false, includeLabels: false, URLclickable: 'Spreadsheet',
                                   missingData: 'Code_Word', hoursInDate: {"Review_Date": true}, contextSentences: 'separateJP', visSimTreshold: 0,
                                  },*/
                       };
//        for (var j = 0; j < exportedInfo.length; j++){
//            defaults.defaults[exportedInfo[j]] = 'None';
//        };

        var settings = $.extend(true, {}, defaults, wkof.settings.Item_Inspector);
        settings.active_fpreset = 0; // must always be 0 on startup
        wkof.settings.Item_Inspector = quiz.settings = settings;

        let ipresets_defaults = [
            {name:'Leeches', content:{wk_items:{enabled:true,filters:{srs:{enabled:true,value:{appr1:true,appr2:true,appr3:true,appr4:true,guru1:true,guru2:true,mast:true}}
                                                                      ,additionalFilters_leechTraining:{enabled:true,value:1}}}},
            },
            {name:'Failed Last Review', content:{wk_items:{enabled:true,filters:{additionalFilters_failedLastReview:{enabled:true,value:24}}}},
            },
            {name:'Current Level SRS', content:{wk_items:{enabled:true,filters:{level:{enabled:true,value:"+0"},
                                                                                srs:{enabled:true,value:{appr1:true,appr2:true,appr3:true,appr4:true,guru1:true,guru2:true,
                                                                                                         mast:true,enli:true,burn:true}}}}},
            },
            {name:'Previous Level SRS', content:{wk_items:{enabled:true,filters:{level:{enabled:true,value:"-1"},
                                                                                 srs:{enabled:true,value:{appr1:true,appr2:true,appr3:true,appr4:true,guru1:true,guru2:true,
                                                                                                          mast:true,enli:true,burn:true}}}}},
            },
            {name:'Burned Items', content:{wk_items:{enabled:true,filters:{srs:{enabled:true,value:{burn:true}}}}},
            },
            {name:'All Learned Items', content:{wk_items:{enabled:true,filters:{srs:{enabled:true,value:{appr1:true,appr2:true,appr3:true,appr4:true,guru1:true,guru2:true,
                                                                                                         mast:true,enli:true,burn:true}}}}},
            },
            {name:'All Wanikani Items', content:{wk_items:{enabled:true,filters:{}}},
            },
        ];

        let tablePresetsDefault = [
            {name:'Leeches', tableContents:{currentItem:0,table_data:"Leech",sort1:"Default",sortOrder1:'Default',sort2:"Default",sortOrder2:'Default',
                                            tooltip1:"Meaning_Full",tooltip2:"Reading_Full",enlargingTooltip:true,
                                            showStrokeOrder:true,showRadical: 'Keisei', showKanji: 'Keisei', showVocabulary: 'Pitch Info',}},
            {name:'Failed Last Review', tableContents:{currentItem:0,table_data:"Leech",sort1:"Default",sortOrder1:'Default',sort2:"Default",sortOrder2:'Default',
                                                       tooltip1:"Meaning_Full",tooltip2:"Reading_Full",enlargingTooltip:true,
                                                       showStrokeOrder:true,showRadical: 'Keisei', showKanji: 'Keisei', showVocabulary: 'Pitch Info',}},
            {name:'Current Level SRS', tableContents:{currentItem:0,table_data:"Srs",sort1:"Default",sortOrder1:'Default',sort2:"Default",sortOrder2:'Default',
                                                      tooltip1:"Review_Date",tooltip2:"Review_Wait",
                                                      showStrokeOrder:true,showRadical: 'Keisei', showKanji: 'Keisei', showVocabulary: 'Pitch Info',}},
            {name:'Previous Level SRS', tableContents:{currentItem:0,table_data:"Srs",sort1:"Default",sortOrder1:'Default',sort2:"Default",sortOrder2:'Default',
                                                       tooltip1:"Review_Date",tooltip2:"Review_Wait",
                                                       showStrokeOrder:true,showRadical: 'Keisei', showKanji: 'Keisei', showVocabulary: 'Pitch Info',}},
            {name:'Burned Items', tableContents:{currentItem:0,table_data:"Level",sort1:"Default",sortOrder1:'Default',sort2:"Default",sortOrder2:'Default',
                                                 tooltip1:"Meaning_Full",tooltip2:"Reading_Full",enlargingTooltip:true,
                                                 showStrokeOrder:true,showRadical: 'Keisei', showKanji: 'Keisei', showVocabulary: 'Pitch Info',}},
            {name:'All Learned Items', tableContents:{currentItem:0,table_data:"Level",sort1:"Default",sortOrder1:'Default',sort2:"Default",sortOrder2:'Default',
                                                 tooltip1:"Meaning_Full",tooltip2:"Reading_Full",tooltip3:"Srs",tooltip4:"Unlock_Date",tooltip5:"Lesson_Date",
                                                 tooltip6:"Passed_Date",tooltip7:"Burned_Date",tooltip8:"Leech",
                                                 showStrokeOrder:true,showRadical: 'Keisei', showKanji: 'Keisei', showVocabulary: 'Pitch Info',}},
            {name:'All Wanikani Items', tableContents:{currentItem:0,table_data:"Level",sort1:"Default",sortOrder1:'Default',sort2:"Default",sortOrder2:'Default',
                                                 tooltip1:"Meaning_Full",tooltip2:"Reading_Full",tooltip3:"Srs",tooltip4:"Unlock_Date",tooltip5:"Lesson_Date",
                                                 tooltip6:"Passed_Date",tooltip7:"Burned_Date",tooltip8:"Leech",
                                                 showStrokeOrder:true, showRadical: 'Keisei', showKanji: 'Keisei', showVocabulary: 'Pitch Info',}},
            ];

        table_defaults = {currentItem:0,table_data:"Leech",sort1:"Default",sortOrder1:'Default',sort2:"Default",sortOrder2:'Default',
                          tooltip1:"Meaning_Full",tooltip2:"Reading_Full",tooltip3:"None",tooltip4:"None",tooltip5:"None",tooltip6:"None",tooltip7:"None",tooltip8:"None",
                          showStrokeOrder:true,showRadical: 'Keisei', showKanji: 'Keisei', showVocabulary: 'Pitch Info',
                          displayMeaning:false, enlargingTooltip:false, showMarkers:true, showMarkersDate:false, showHours:false, leechStreakLimit:0,
                          showStrokeOrder:true, showRadical: 'Keisei', showKanji: 'Keisei', showVocabulary: 'Pitch Info',
                          randomSelection: 0, oncePerReviewPeriod: false, addSimilarItems: false, navigationDate:'Lesson_Date',
                          includeTitle:false, includeLabels:false,missingData:'Code_Word',separator:'\t',quotes:'Never',URLclickable:'Plain',
                          hoursInDate:{'Review_Date': true, 'Last_Review_Date': true,}, contextSentences: 'separateJP', visSimTreshold:0,};
        for (var i = 0; i < exportedInfo.length; i++){
            table_defaults[exportedInfo[i]] = 'None';
        };

        let fpresets_defaults = [
            {name: noTemporaryFilterName, ask: false, content:{wk_items:{enabled:true,filters:{}}},
            },
            {name:'Leeches Value >= 2.0', ask: false, content:{wk_items:{enabled:true,filters:{additionalFilters_leechTraining:{enabled:true,value:2}}}},
            },
            {name:'Min. Current Streak >= 2', ask: false, content:{wk_items:{enabled:true,filters:{statsFilters_minCurStrGteq:{enabled:true,value:2}}}},
            },
            {name:'Min. Current Streak <= 1', ask: false, content:{wk_items:{enabled:true,filters:{statsFilters_minCurStrLteq:{enabled:true,value:1}}}},
            },
            {name:'Apprentice Items', ask: false, content:{wk_items:{enabled:true,filters:{srs:{enabled:true,value:{appr1:true,appr2:true,appr3:true,appr4:true,guru1:false,guru2:false,mast:false,enli:false}}}}},
            },
            {name:'Has Passed Guru', ask: false, content:{wk_items:{enabled:true,filters:{dateFilters_hadPassedGuru:{enabled:true,value:true},}}},
            },
            {name:'Has Not Passed Guru', ask: false, content:{wk_items:{enabled:true,filters:{dateFilters_hadPassedGuru:{enabled:true,value:false},}}},
            },
            {name:'Global Search', ask: true, content:{wk_items:{enabled:true,filters:{searchFilters_globalSearch:{enabled:true,value:''},}}},
            },
        ];
        fpreset_defaults = {ask: false, };
        ipreset_defaults = {};

        // define defaults if ipresets not yet defined or empty
        if (settings.ipresets === undefined || !settings.ipresets.length) {
            settings.active_ipreset = 0;
            settings.ipresets = ipresets_defaults;
            var x = [];
            for (var y of tablePresetsDefault){x.push($.extend(true, {}, table_defaults, y.tableContents))};
            settings.tablePresets = x;
        };

        // define defaults if fpresets not yet defined or empty
        if (settings.fpresets === undefined || !settings.fpresets.length) {
            settings.active_fpreset = 0;
            settings.fpresets = fpresets_defaults;
        };

        for (var idx in settings.ipresets) {
            settings.ipresets[idx] = $.extend(true, {}, ipreset_defaults, settings.ipresets[idx]);
            settings.ipresets[idx].content = $.extend(true, {}, ipre_defaults, settings.ipresets[idx].content);
        };

        for (idx in settings.fpresets) {
            settings.fpresets[idx] = $.extend(true, {}, fpreset_defaults, settings.fpresets[idx]);
            settings.fpresets[idx].content = $.extend(true, {}, fpreset_defaults, ipre_defaults, settings.fpresets[idx].content);
        };

        for (idx in settings.tablePresets) {
            settings.tablePresets[idx] = $.extend(true, {}, table_defaults, settings.tablePresets[idx]);
        };

        table_defaults.showStrokeOrder = settings.tablePresets.reduce(((acc, preset) => acc || preset.showStrokeOrder), false);

        restoreMissingDefaults = restoreMissingDefaultsInternal;
        lackDefaults = lackDefaultsInternal;

        function restoreMissingDefaultsInternal(){
            let somethingNotFound = false;
            for (var idx in ipresets_defaults){
                let tableData = ipresets_defaults[idx];
                let name = tableData.name;
                let found = false;
                settings.ipresets.forEach((config) => {if (config.name === name) found = true;});
                somethingNotFound = somethingNotFound || !found;
                if (found !== true) {
                    settings.ipresets.push($.extend(true, {}, {name: name, content: ipre_defaults}, tableData));
                    settings.tablePresets.push($.extend(true, {}, table_defaults, tablePresetsDefault[idx].tableContents));
                };
            };
            for (var tableData of fpresets_defaults){
                let name = tableData.name;
                let found = false;
                settings.fpresets.forEach((config) => {if (config.name === name) found = true;});
                somethingNotFound = somethingNotFound || !found;
                if (found !== true) settings.fpresets.push($.extend(true, {}, {name: name, content: ipre_defaults}, tableData));
            };
            refresh_ipresets();
            refresh_fpresets();
            if (somethingNotFound){
                alert('Your missing defaults have been restored.');
            } else {
                alert('You have no missing defaults.');
            };
        };

        function lackDefaultsInternal(){
            for (var idx in ipresets_defaults){
                let found = false;
                let tableData = ipresets_defaults[idx];
                let name = tableData.name;
                settings.ipresets.forEach((config) => {if (config.name === name) found = true;});
                if (!found) return true;
            };
            for (var tableData of fpresets_defaults){
                let found = false;
                let name = tableData.name;
                settings.fpresets.forEach((config) => {if (config.name === name) found = true;});
                if (!found) return true;
            };
            return false;
        };

    };

    //========================================================================
    // Collects from the registry default values for the filters settings
    //------------------------------------------------------------------------
    var ipre_defaults;
    function prepare_defaults_for_filters(){
        var srcs = wkof.ItemData.registry.sources;
        ipre_defaults = {};
        let src_name = 'wk_items';
        var src = srcs[src_name];
        var settings = {};
        ipre_defaults[src_name] = settings;
        if (src.filters && Object.keys(src.filters).length > 0) {
            settings.filters = {};
            for (var flt_name in src.filters) {
                var flt = src.filters[flt_name];
                settings.filters[flt_name] = {enabled:false, value:flt.default};
                if (flt.type === 'multi'){
                    var dflt = flt.default;
                    if (typeof flt.filter_value_map === 'function') dflt = flt.filter_value_map(dflt);
                    settings.filters[flt_name].value = dflt;
                    };
            };
        };
    };

    //========================================================================
    // Populates the settings dialog with filters from the registry
    // Calegorizes the filters in groups on the fly
    //------------------------------------------------------------------------
    function populate_items_config(config) {
        const group_labels = {basics: 'Basics', leech: 'Leech Studying', burned: 'Burned Items Studying', review: 'Lessons and Reviews', date: 'Dates and Events',
                              search: 'Search', item: 'Items and Information', stats: 'Statistics', other: 'Other Filters'}
        const flt_ordering = {item_type: {group: 'basics', order: 10, suborder: 10}, level: {group: 'basics', order: 10, suborder: 20},
                              srs: {group: 'basics', order: 10, suborder: 30}, //have_burned: {group: 'basics', order: 10, suborder: 40},

                              additionalFilters_leechTraining: {group: 'leech', order: 20, suborder: 10}, statsFilters_LeechLteq: {group: 'leech', order: 20, suborder: 20},
                              statsFilters_minCurStrGteq: {group: 'leech', order: 20, suborder: 30}, statsFilters_minCurStrLteq: {group: 'leech', order: 20, suborder: 40},
                              statsFilters_percentageTotalCorGteq: {group: 'leech', order: 20, suborder: 50}, statsFilters_percentageTotalCorLteq: {group: 'leech', order: 20, suborder: 60},

                              have_burned: {group: 'burned', order: 30, suborder: 10},
                              dateFilters_burnedAfter: {group: 'burned', order: 30, suborder: 20}, dateFilters_burnedBefore: {group: 'burned', order: 30, suborder: 30},

                              additionalFilters_recentLessons: {group: 'review', order: 40, suborder: 10}, additionalFilters_timeUntilReview: {group: 'review', order: 40, suborder: 20},
                              additionalFilters_failedLastReview: {group: 'review', order: 40, suborder: 30},

                              dateFilters_hadLastReviewScheduled: {group: 'date', order: 50, suborder: 4},
                              dateFilters_lastReviewAfter: {group: 'date', order: 50, suborder: 6}, dateFilters_lastReviewBefore: {group: 'date', order: 50, suborder: 8},
                              dateFilters_reviewIsScheduled: {group: 'date', order: 50, suborder: 10},
                              dateFilters_reviewAfter: {group: 'date', order: 50, suborder: 20}, dateFilters_reviewBefore: {group: 'date', order: 50, suborder: 30},
                              dateFilters_hadLesson: {group: 'date', order: 50, suborder: 40},
                              dateFilters_lessonAfter: {group: 'date', order: 50, suborder: 50}, dateFilters_lessonBefore: {group: 'date', order: 50, suborder: 60},
                              dateFilters_hadPassedGuru: {group: 'date', order: 50, suborder: 70},
                              dateFilters_passedGuruAfter: {group: 'date', order: 50, suborder: 80}, dateFilters_passedGuruBefore: {group: 'date', order: 50, suborder: 90},
                              dateFilters_hadResurrected: {group: 'date', order: 50, suborder: 100},
                              dateFilters_resurrectedAfter: {group: 'date', order: 50, suborder: 110}, dateFilters_resurrectedBefore: {group: 'date', order: 50, suborder: 120},
                              dateFilters_isUnlocked: {group: 'date', order: 50, suborder: 130},
                              dateFilters_unlockedAfter: {group: 'date', order: 50, suborder: 140}, dateFilters_unlockedBefore: {group: 'date', order: 50, suborder: 150},

                              searchFilters_globalSearch: {group: 'search', order: 55, suborder: 50}, searchFilters_exactSearch: {group: 'search', order: 55, suborder: 60},
                              searchFilters_kunSearch: {group: 'search', order: 55, suborder: 70}, searchFilters_onSearch: {group: 'search', order: 55, suborder: 80},
                              searchFilters_componentsSearch: {group: 'search', order: 55, suborder: 90}, searchFilters_usedInSearch: {group: 'search', order: 55, suborder: 100},
                              searchFilters_visSimSearch: {group: 'search', order: 55, suborder: 100}, visually_similar_kanji : {group: 'search', order: 55, suborder: 110},
                              part_of_speech: {group: 'search', order: 55, suborder: 200},
                              searchFilters_allowSearch: {group: 'search', order: 55, suborder: 210}, searchFilters_blockSearch: {group: 'search', order: 55, suborder: 220},
                              searchFilters_ctxSenkSearch: {group: 'search', order: 55, suborder: 230}, searchFilters_mnemonicsSearch: {group: 'search', order: 55, suborder: 240},

                              radical_list: {group: 'item', order: 60, suborder: 10}, kanji_list: {group: 'item', order: 60, suborder: 20},
                              vocabulary_list: {group: 'item', order: 60, suborder: 30}, additionalFilters_relatedItems: {group: 'item', order: 60, suborder: 40},
                              jlpt_level: {group: 'item', order: 60, suborder: 230}, jlpt_level_vocab: {group: 'item', order: 60, suborder: 235},
                              joyo_grade: {group: 'item', order: 60, suborder: 240}, joyo_grade_vocab: {group: 'item', order: 60, suborder: 245},
                              total_frequency: {group: 'item', order: 60, suborder: 250}, total_frequency_vocab: {group: 'item', order: 60, suborder: 255},

                              statsFilters_meaningCorAnsGteq: {group: 'stats', order: 70, suborder: 10}, statsFilters_meaningCorAnsLteq: {group: 'stats', order: 70, suborder: 20},
                              statsFilters_readingCorAnsGteq: {group: 'stats', order: 70, suborder: 30}, statsFilters_readingCorAnsLteq: {group: 'stats', order: 70, suborder: 40},
                              statsFilters_meaningIncorAnsGteq: {group: 'stats', order: 70, suborder: 50}, statsFilters_meaningIncorAnsLteq: {group: 'stats', order: 70, suborder: 60},
                              statsFilters_readingIncorAnsGteq: {group: 'stats', order: 70, suborder: 70}, statsFilters_readingIncorAnsLteq: {group: 'stats', order: 70, suborder: 80},
                              statsFilters_totalCorAnsGteq: {group: 'stats', order: 70, suborder: 90}, statsFilters_totalCorAnsLteq: {group: 'stats', order: 70, suborder: 100},
                              statsFilters_totalIncorAnsGteq: {group: 'stats', order: 70, suborder: 110}, statsFilters_totalIncorAnsLteq: {group: 'stats', order: 70, suborder: 120},
                              statsFilters_percentageMeaningCorGteq: {group: 'stats', order: 70, suborder: 130}, statsFilters_pecentagerMeaningCorLteq: {group: 'stats', order: 70, suborder: 140},
                              statsFilters_percentageReadingCorGteq: {group: 'stats', order: 70, suborder: 150}, statsFilters_percentageReadingCorLteq: {group: 'stats', order: 70, suborder: 160},
                              statsFilters_meaningCurStrGteq: {group: 'stats', order: 70, suborder: 170}, statsFilters_meaningCurStrLteq: {group: 'stats', order: 70, suborder: 180},
                              statsFilters_meaningMaxStrGteq: {group: 'stats', order: 70, suborder: 190}, statsFilters_meaningMaxStrLteq: {group: 'stats', order: 70, suborder: 200},
                              statsFilters_readingCurStrGteq: {group: 'stats', order: 70, suborder: 210}, statsFilters_readingCurStrLteq: {group: 'stats', order: 70, suborder: 220},
                              statsFilters_readingMaxStrGteq: {group: 'stats', order: 70, suborder: 230}, statsFilters_readingMaxStrLteq: {group: 'stats', order: 70, suborder: 240},
                              statsFilters_bothCurStrGteq: {group: 'stats', order: 70, suborder: 250}, statsFilters_bothCurStrLteq: {group: 'stats', order: 70, suborder: 260},
                              statsFilters_numReviewsLteq: {group: 'stats', order: 70, suborder: 270}, statsFilters_numReviewsGteq: {group: 'stats', order: 70, suborder: 280},
                             };
        const dflt_ordering = {group: 'other', order: 100000, suborder: 100000};

        var ipre_srcs = config.settings.pg_items.content.grp_ipre.content.ipre_srcs.content;
        var fpre_srcs = config.settings.pg_filters.content.grp_fpre.content.fpre_srcs.content;
        var srcs = wkof.ItemData.registry.sources;
        let src_name = 'wk_items';
        var src = srcs[src_name];
        var pg_icontent = {};
        var pg_fcontent = {};
        ipre_srcs['pg_'+src_name] = {type:'page',label:'Filters',content:pg_icontent};
        fpre_srcs['pg_'+src_name] = {type:'page',label:'Filters',content:pg_fcontent};

        // Add 'Filters' section.
        if (src.filters && Object.keys(src.filters).length > 0) {
            var flt_icontent = {};
            var flt_fcontent = {};
            var flt_content;
            let fltList = [];
            pg_icontent['grp_'+src_name+'_ifilters'] = {type:'group',label:group_labels.basics,content:flt_icontent};
            pg_fcontent['grp_'+src_name+'_ffilters'] = {type:'group',label:group_labels.basics,content:flt_fcontent};
            for (var flt_name in src.filters) {
                var flt = src.filters[flt_name];
                if (flt.no_ui  || flt.type === undefined) continue;  // no_ui or one of Kumirei's typeless filters
                let fltOrder = flt_ordering[flt_name] || dflt_ordering;
                fltList.push([flt_name, flt, fltOrder]);
            };
            fltList.sort((a,b)=> a[2].order === b[2].order ? a[2].suborder - b[2].suborder : a[2].order - b[2].order);
            let curGroup = 'basics'
            for (let triple in fltList){
                flt_name = fltList[triple][0];
                flt = fltList[triple][1];
                let group = fltList[triple][2].group;
                if (group !== curGroup){
                    flt_icontent = {};
                    flt_fcontent = {};
                    pg_icontent['grp_'+group+'_ifilters'] = {type:'group',label:group_labels[group],content:flt_icontent};
                    pg_fcontent['grp_'+group+'_ffilters'] = {type:'group',label:group_labels[group],content:flt_fcontent};
                    curGroup = group;
                }
                flt_content = getFilterInformation(flt);
                flt_icontent[src_name+'_iflt_'+flt_name] = $.extend(true, {}, flt_content);
                flt_icontent[src_name+'_iflt_'+flt_name].path = '@ipresets[@active_ipreset].content["'+src_name+'"].filters["'+flt_name+'"].value';
                flt_fcontent[src_name+'_fflt_'+flt_name] = $.extend(true, {}, flt_content);
                flt_fcontent[src_name+'_fflt_'+flt_name].path = '@fpresets[@active_fpreset].content["'+src_name+'"].filters["'+flt_name+'"].value';
            };
        };
    }

    function getFilterInformation(flt){
        var flt_content
        switch (flt.type) {
            case 'checkbox':
                flt_content = {
                    type:'checkbox',
                    label:flt.label,
                    default:flt.default,
                    hover_tip:flt.hover_tip
                }
                break;
            case 'multi':
                var dflt = flt.default;
                if (typeof flt.filter_value_map === 'function') dflt = flt.filter_value_map(dflt);
                flt_content = {
                    type:'list',
                    multi:true,
                    size:Math.min(4,Object.keys(flt.content).length),
                    label:flt.label,
                    content:flt.content,
                    default:dflt,
                    hover_tip:flt.hover_tip
                }
                break;
            case 'text':
            case 'number':
            case 'input':
                flt_content = {
                    type:flt.type,
                    label:flt.label,
                    validate:flt.validate,
                    placeholder:flt.placeholder,
                    default:flt.default,
                    hover_tip:flt.hover_tip
                }
                break;
            case 'button':
                flt_content = {
                    type:flt.type,
                    label:flt.label,
                    text:flt.text,
                    on_click:flt.on_click,
                    callable_dialog:flt.callable_dialog,
                    hover_tip:flt.hover_tip,
                    script:scriptId,
                }
                break;
        };
        return flt_content;
    }

    //========================================================================
    // event handler for the enabling checkboxes of filters
    //------------------------------------------------------------------------
    function toggle_filter(e) {
        var row = $(e.delegateTarget);
        var panel = row.closest('[role="tabpanel"]');
        var source = panel.attr('id').match(/^Item_Inspector_pg_(.*)$/)[1];
        var enabled = row.find('.enable input[type="checkbox"]').prop('checked');
        var name = row.find('.setting').attr('name');
        var filter_name = name.slice((source+'_iflt_').length);
        if (name.charAt(source.length + 1) === 'i') {
            var preset = quiz.settings.ipresets[quiz.settings.active_ipreset].content;
        } else {
            preset = quiz.settings.fpresets[quiz.settings.active_fpreset].content;
            if ($('#Item_Inspector_active_fpreset').prop('selectedIndex') === 0){
                enabled = false;
                row.find('.enable input[type="checkbox"]').prop('checked', false);
            }
        }

        if (enabled) {
            row.addClass('checked');
        } else {
            row.removeClass('checked');
        }
        try {
            preset[source].filters[filter_name].enabled = enabled;
        } catch(e) {}
    }

    //========================================================================
    // populates lists of tables and temporary filters with settings values
    //------------------------------------------------------------------------
    function populate_presets(elem, presets, active_preset) {
        var html = '';
        var is_fpresets = (elem.attr('id') === 'Item_Inspector_active_fpreset');
        for (var idx in presets) {
            var preset = presets[idx];
            var name = preset.name.replace(/</g,'&lt;').replace(/>/g,'&gt;');
            if ((idx === '0') && (idx === active_preset) && is_fpresets){
                name = noTemporaryFilterName;
                preset.name = name;
                $('#Item_Inspector_fpre_name').val(name);
                preset.ask = false;
                $('#Item_Inspector_fpre_ask').val(false);
            }
            html += '<option name="'+idx+'">'+name+'</option>';
        }
        elem.html(html);
        elem.children().eq(active_preset).prop('selected', true);

    }

    //========================================================================
    // css specific to the settings
    //------------------------------------------------------------------------
    function install_css() {
        $('head').append(
            '<style id="Item_Inspector_css" type="text/css">'+

            //--[ Settings dialog ]-------------------------------------------
            '#wkof_ds div[role="dialog"][aria-describedby="wkofs_Item_Inspector"] {z-index:12002;}'+

            '#wkofs_Item_Inspector.wkof_settings .pre_list_btn_grp {width:60px;float:left;margin-right:2px;}'+
            '#wkofs_Item_Inspector.wkof_settings .pre_list_btn_grp button {width:100%; padding:2px 0;}'+
            '#wkofs_Item_Inspector.wkof_settings .pre_list_btn_grp button:not(:last-child) {margin-bottom:2px;}'+
            '#wkofs_Item_Inspector.wkof_settings .pre_list_wrap {display:flex;}'+
            '#wkofs_Item_Inspector.wkof_settings .pre_list_wrap .right {flex:1;}'+
            '#wkofs_Item_Inspector.wkof_settings .pre_list_wrap .list {overflow:auto;height:100%;}'+

            '#wkofs_Item_Inspector.wkof_settings .filters .row {border-top:1px solid #ccc; padding:6px 4px; margin-bottom:0;}'+
            '#wkofs_Item_Inspector.wkof_settings .filters .row:not(.checked) {padding-top:0px;padding-bottom:0px;}'+
            '#wkofs_Item_Inspector .filters .row .enable input[type="checkbox"] {margin:0;}'+
            '#wkofs_Item_Inspector.narrow .filters .row.checked .right input[type="checkbox"]:after {content:"⇐yes?";margin-left:28px;line-height:30px;}'+
            '#wkofs_Item_Inspector .filters .row.checked {background-color:#f7f7f7;}'+
            '#wkofs_Item_Inspector .filters .row:not(.checked) {opacity:0.5;}'+
            '#wkofs_Item_Inspector .filters .row .enable {display:inline; margin:0; float:left;}'+
            '#wkofs_Item_Inspector:not(.narrow) .filters .left {width:170px;}'+

            '#wkofs_Item_Inspector .filters .row .enable input[type="checkbox"] {margin:0 4px 0 0;}'+
            '#wkofs_Item_Inspector .filters .row:not(.checked) .right {display:none;}'+
            '#wkofs_Item_Inspector .filters .row:not(.checked) .left label {text-align:left;}'+
            '#wkofs_Item_Inspector.narrow .filters .row .left {width:initial;}'+
            '#wkofs_Item_Inspector.narrow .filters .row .left label {line-height:30px;}'+
            '#wkofs_Item_Inspector #Item_Inspector_ipre_srcs .src_enable .left {width:initial;}'+
            '#wkofs_Item_Inspector #Item_Inspector_ipre_srcs .src_enable .left label {text-align:left;width:initial;line-height:30px;}'+
            '#wkofs_Item_Inspector #Item_Inspector_ipre_srcs .src_enable .right {float:left; margin:0 4px;width:initial;}'+
            //----------------------------------------------------------------

            '</style>'
        );
    }

    //======================================================================
    // End of the settings
    // This section was under the MIT license
    //----------------------------------------------------------------------

    //======================================================================
    // Functions for fetching, filtering and indexing items
    // Much of this code was originally bowwed from Self-Study quiz with excerpts from wkof ItemData module
    // and has been heavily modified (read almost completely rewritten) for the needs of Item Inspector
    //
    // this whole series of functions is under the MIT license ; http://opensource.org/licenses/MIT
    // because this is the original license of Self Study Quiz and wkof ItemData module
    //----------------------------------------------------------------------

    // Four indexes are indexed by subject id.
    // Over 80% of the time we know the item type so we can search a smaller and faster index.
    // Therefore we have indexes by item type: subjectIndexRad, subjectIndexKan, subjectIndexVoc
    // In the volume, accelerating the indexes when we know the type improves significantly the response time.
    // There is also an index for when we don't know the item type: subjectIndex
    var subjectIndex = false;
    var subjectIndexVoc = {};
    var subjectIndexKan = {};
    var subjectIndexRad = {};

    // We have an index of kanji by the character for Keisei Semantic-Phonetic composition
    var kanjiIndex = {};

    // We have an index of svg images for the radicals without characters - indexed by subject id
    var svgForRadicals = {};

    //============================================================================
    // Begin code lifted from wkof core module and adapted to transfer binary data

	function split_list(str) {return str.replace(/^\s+|\s*(,)\s*|\s+$/g, '$1').split(',').filter(function(name) {return (name.length > 0);});}
	function promise(){var a,b,c=new Promise(function(d,e){a=d;b=e;});c.resolve=a;c.reject=b;return c;}

    //------------------------------
	// Load a file asynchronously, and pass the file as resolved Promise data.
	//------------------------------
	function load_file(url, use_cache, options) {
		var fetch_promise = promise();
		var no_cache = split_list(localStorage.getItem('wkof.load_file.nocache') || '');
		if (no_cache.indexOf(url) >= 0 || no_cache.indexOf('*') >= 0) use_cache = false;
		if (use_cache === true) {
			return wkof.file_cache.load(url, use_cache).catch(fetch_url);
		} else {
			return fetch_url();
		}

		// Retrieve file from server
		function fetch_url(){
			var request = new XMLHttpRequest();
			request.onreadystatechange = process_result;
			request.open('GET', url, true);
            if (options.responseType) request.responseType = options.responseType;
			request.send();
			return fetch_promise;
		}

		function process_result(event){
			if (event.target.readyState !== 4) return;
			if (event.target.status >= 400 || event.target.status === 0) return fetch_promise.reject(event.target.status);
			if (use_cache) {
				wkof.file_cache.save(url, event.target.response)
				.then(fetch_promise.resolve.bind(null,event.target.response));
			} else {
				fetch_promise.resolve(event.target.response);
			}
		}
	}

    // End code lifted from wkof core module and adapted to transfer binary data

    //========================================================================
    // fetching all items from wkof
    //
    // function to be invoked in the startup sequence
    //------------------------------------------------------------------------
    function fetch_all_items() {

//        return wkof.load_file('http://127.0.0.1:8887/All_Items.json')
//                  .then(function(items){quiz.allItems = JSON.parse(items); makeIndexes(quiz.allItems);});

        let configIndex = {wk_items: {filters:{},
                                      options:{'subjects': true, 'assignments': true, 'review_statistics': true, 'study_materials': true}}};
        return wkof.ItemData.get_items(configIndex).then(function(items){quiz.allItems = items; makeIndexes(items);})
    };

    function makeIndexes(items){
        subjectIndex = {};
        for (let item of items){
            subjectIndex[item.id] = item;
            switch (item.object){
                case 'vocabulary':
                    subjectIndexVoc[item.id] = item;
                    break;
                case 'kanji':
                    subjectIndexKan[item.id] = item;
                    kanjiIndex[item.data.characters] = item;
                    break;
                case 'radical':
                    subjectIndexRad[item.id] = item;
                    break;
            };
        };
    };

    function loadSvgForRadicals(){
        return wkof.file_cache.load(Wkit_SVGforRadicals)
                   .then(function(data){svgForRadicals = data})
                   .catch(function(e){return assembleSvgForRadicals()
                                                .then(function(){wkof.file_cache.save(Wkit_SVGforRadicals, svgForRadicals)})
                                     }
                         )

        function assembleSvgForRadicals(){
            let promiseList = [];
            for (let radical of Object.values(subjectIndexRad)){
                if (radical.data.characters === null){
                    let svgForRadicalsFile = radical.data.character_images.find((file) => (file.content_type === 'image/svg+xml' && (!file.metadata.inline_styles))).url;
                    promiseList.push(wkof.load_file(svgForRadicalsFile, false)
                                         .then((function(data){svgForRadicals[radical.id] = data;}))
                                    );
                };
            };
            return Promise.all(promiseList);
        };

        //return load_file(svgForRadicalsFile, true, {responseType: "arraybuffer"})
        //     .then(function(data){lzmaDecompressAndProcessSvgForRadicals(data)})
    };

/*    function lzmaDecompressAndProcessSvgForRadicals(data){
        let inStream = new LZMA.iStream(data);
        let outStream = LZMA.decompressFile(inStream);
        let string = streamToString(outStream);
        svgForRadicals = JSON.parse(string);
    };*/

    //========================================================================
    // Filtering the items for a table
    //------------------------------------------------------------------------
    function filter_items_for_table() {
        var settings = quiz.settings;
        var ipreset = settings.ipresets[settings.active_ipreset].content;
        var presets = settings.tablePresets[settings.active_ipreset];

        var src_name = 'wk_items';
        var src_preset = ipreset[src_name];
        var filters = {};
        var ipre_filters = src_preset.filters;
        for (var flt_name in ipre_filters) {
            var ipre_flt = ipre_filters[flt_name];
            if (!ipre_flt.enabled) continue;
            if (!wkof.ItemData.registry.sources[src_name].filters[flt_name]) continue;
            filters[flt_name] = {value: ipre_flt.value};
            if (ipre_flt.invert === true) filters[flt_name].invert = true;
        }

        var spec = wkof.ItemData.registry.sources[src_name];
        apply_filters(quiz.allItems, filters, spec);
    };


/*    function fetch_items(required) {
        var settings = quiz.settings;
        var ipreset = settings.ipresets[settings.active_ipreset].content;
        var presets = settings.tablePresets[settings.active_ipreset];
        let configIndex = {wk_items: {filters:{},
                                      options:{'subjects': true, 'assignments': true, 'review_statistics': true, 'study_materials': true}}};

        let idList = presets.itemList;
        if (idList != undefined){
            if (idList.length > 0){
                if (subjectIndex === false){
                    return wkof.ItemData.get_items(configIndex)
                        .then(function(items2){makeIndexes(items2);
                                               quiz.items = idList.map(id => subjectIndex[id]);
                                              });
                } else {
                    quiz.items = idList.map(id => subjectIndex[id]);
                    return Promise.resolve();
                };
            };
        };

        var config = {};
        for (var src_name in ipreset) {
            var src_preset = ipreset[src_name];
            if (!wkof.ItemData.registry.sources[src_name]) continue;
            var src_cfg = {};
            config[src_name] = src_cfg;
            src_cfg.filters = {};
            if (src_name === 'wk_items') src_cfg.options = {'subjects': true, 'assignments': true, 'review_statistics': true, 'study_materials': true};
            var ipre_filters = src_preset.filters;
            for (var flt_name in ipre_filters) {
                var ipre_flt = ipre_filters[flt_name];
                if (!ipre_flt.enabled) continue;
                if (!wkof.ItemData.registry.sources[src_name].filters[flt_name]) continue;
                src_cfg.filters[flt_name] = {value: ipre_flt.value};
                if (ipre_flt.invert === true) src_cfg.filters[flt_name].invert = true;
            }
        }

        // It is best not to run the two wkof.ItemData.get_items concurrently because they go for the same items.
        // The unfiltered request goes first and the filtered one will run on the cache once the items are there.
        // A concurrent run doesn't make sense and leads to weird bugs.
        if (subjectIndex === false){
            return wkof.ItemData.get_items(configIndex)
                .then(function(items2){makeIndexes(items2);
                                       return wkof.ItemData.get_items(config)}).then(function(items){quiz.items = items;});
        } else {
            return wkof.ItemData.get_items(config)
                .then(function(items){quiz.items = items;});
        };
    };*/

    function applyTemporaryFilter(){
        var settings = quiz.settings;
        if (settings.active_fpreset === 0) return;
        var fpreset = settings.fpresets[settings.active_fpreset].content;
        var presets = settings.tablePresets[settings.active_ipreset];

        var src_name = 'wk_items';
        var src_preset = fpreset[src_name];
        var filters = {};
        var fpre_filters = src_preset.filters;
        for (var flt_name in fpre_filters) {
            var fpre_flt = fpre_filters[flt_name];
            if (!fpre_flt.enabled) continue;
            if (!wkof.ItemData.registry.sources[src_name].filters[flt_name]) continue;
            filters[flt_name] = {value: fpre_flt.value};
            if (fpre_flt.invert === true) filters[flt_name].invert = true;
        }
        var spec = wkof.ItemData.registry.sources[src_name];
        apply_filters(quiz.items, filters, spec);
    }

	//------------------------------
	// Filter the items array according to the specified filters and options.
	//------------------------------
	function apply_filters(items, cfg, spec) {
		var filters = [];
		var is_wk_items = (spec === wkof.ItemData.registry.sources.wk_items);
		for (var filter_name in cfg) {
			var filter_cfg = cfg[filter_name];
			if (typeof filter_cfg !== 'object' || filter_cfg.value === undefined)
				filter_cfg = {value:filter_cfg};
			var filter_value = filter_cfg.value;
			var filter_spec = spec.filters[filter_name];
			if (filter_spec === undefined) throw new Error('Item Inspector Temporary Filters - Invalid filter "'+filter_name+'"');
			if (typeof filter_spec.filter_value_map === 'function')
				filter_value = filter_spec.filter_value_map(filter_cfg.value);
			if (typeof filter_spec.prepare === 'function') {
				var result = filter_spec.prepare(filter_value);
            };
			filters.push({
				name: filter_name,
				func: filter_spec.filter_func,
				filter_value: filter_value,
				invert: (filter_cfg.invert === true)
			});
		}

        result = [];
        for (var item of items) {
            var keep = true;
            for (var filter of filters) {
                try {
                    keep = filter.func(filter.filter_value, item);
                    if (filter.invert) keep = !keep;
                    if (!keep) break;
                } catch(e) {
                    keep = false;
                    break;
                }
            }
            if (keep) result.push(item);
        }
        quiz.items = result;
	}

    //====================================
    // end of the fetching, filtering and indexing functions
    // This section was under the MIT license
    //------------------------------------

    //====================================
    // Producing the popup and exported data
    //
    // The heart is a big object called metadata
    // All the code doing the processing specific to a popup or export data is registered in metadata
    // The relevant functions call the code registered in metadata whenever they need to do specific to the popup and exported data
    //------------------------------

    //---------------------------
    // constants used in metadata
    const theFuture = Date.parse("01 Jan 2090 00:00:00 GMT");
    const infinity = 100000000; // big enough
    const srsName = ["Initiate","Apprentice I","Apprentice II","Apprentice III","Apprentice IV","Guru I","Guru II","Master","Enlightened","Burned"];

    //=====================================
    // Index of metadata: The name of the table entry to be processed
    //
    // Metadata properties
    //
    // exists            - A function (item) => boolean  indicating whether the information is relevant to an item type
    // label             - The text of the label for the information in a popup table
    // tableEntry        - A function (item) => string  formatting the data for display as the table element in table mode
    // tableEntry Marker - A function (item) => string  formatting the data for display as the marker in icon list mode
    // tooltipEntry      - A function (item) => string  formatting the data for display in a popup table
    // sortKey           - A function (item) => data    preferred data used as a sort key when items are sorted by this table entry
    // sortOrder         - The sort order for sortKey
    // sortKey2          - A function (item) => data    for data used in the secondary sort key when items are sorted by this table entry and
    //                     the secondary sort key is the default
    // sortOrder2        - The sort order for sortKey2
    // preciseSortKey    - A function (item) => data    A sort key for dates precise to the millisecond. Other date sort keys are trimmed to the minutes boundary for UI reasons
    // wordCloud         - A function (item) => integer  for producing a repeat count of items for word cloud generation
    // title             - The column title in an expeort to csv title line
    // needQuotes        - A boolean indicating wether the export to csv data needs quotes whne comma is the separator because it contains commas
    // freeFormText      - A boolean indicating wether text may contain quotes or linefeeds
    // export            - A function (item) => string  formatting the data for an export to csv
    // itemList          - A function (item) => Array of items  for producing the array of items for data that is a list of subject id
    // idList            - A function (item) => Array of subject id  for producing all the subject id for data that is a list of subject id
    // isDate            - A boolean indicating whether the data is a date
    // isList            - A boolean indicating whether the data is a list of subject id

    const metadata = {
                      // ----------------------------
                      // Basic info

                      'Item': {'exists': ((item) => {return true}),
                             'title': 'Item',
                             'labelExport': '',
                             'needQuotes': false,
                             'freeFormText': false,
                             'export': ((item) => {return (item.data.characters ? item.data.characters : item.data.slug)}),
                             'isDate': false, 'isList': false,
                            },
                    'Type': {'exists': ((item) => {return true}),
                             'sortkey':  ((item) => { return {'radical': 1, 'kanji': 2, 'vocabulary': 3}[item.object]}),
                             'sortOrder': 'Ascending',
                             'sortkey2':  ((item) => { return {'radical': 1, 'kanji': 2, 'vocabulary': 3}[item.object]}),
                             'sortOrder2': 'Ascending',
                             'title': 'Type',
                             'labelExport': '',
                             'needQuotes': false,
                             'freeFormText': false,
                             'export': ((item) => {return (item.object != undefined ? item.object : 'Unavailable')}),
                             'isDate': false, 'isList': false,
                            },
                    'Meaning_Brief': {'exists': ((item) => {return true}), 'label': 'Meaning ',
                                      'tableEntry': meaningsBrief,
                                      'tableEntryMarker': ((item)=>''),
                                      'tooltipEntry': meaningsBrief,
                                      'sortkey': ((item) => {return 0}),
                                      'sortOrder': 'Ascending',
                                      'sortkey2': ((item) => {return 0}),
                                      'sortOrder2': 'Ascending',
                                      'title': 'Meaning',
                                      'needQuotes': true,
                                      'freeFormText': false,
                                      'labelExport': '',
                                      'export': meaningsBrief,
                                      'isDate': false, 'isList': false,
                                     },
                    'Meaning_Full': {'exists': ((item) => {return true}), 'label': 'Meaning ',
                                     'tooltipEntry': meaningsFull,
                                     'sortkey': ((item) => {return 0}),
                                     'sortOrder': 'Ascending',
                                     'sortkey2': ((item) => {return 0}),
                                     'sortOrder2': 'Ascending',
                                     'title': 'Meaning',
                                     'labelExport': '',
                                     'needQuotes': true,
                                     'freeFormText': false,
                                     'export': meaningsFull,
                                     'isDate': false, 'isList': true,
                                    },
                    'Reading_Brief': {'exists': ((item) => {return !(item.data.readings == undefined)}), 'label': 'Reading ',
                                      'tableEntry': readingsBrief,
                                      'tableEntryMarker': ((item)=>''),
                                      'tooltipEntry': readingsBrief,
                                      'sortkey': ((item) => {return 0}),
                                      'sortOrder': 'Ascending',
                                      'sortkey2': ((item) => {return 0}),
                                      'sortOrder2': 'Ascending',
                                      'title': 'Reading',
                                      'labelExport': '',
                                      'needQuotes': true,
                                      'freeFormText': false,
                                      'export': readingsBrief,
                                      'isDate': false, 'isList': true,
                                     },
                    'Reading_Full': {'exists': ((item) => {return !(item.data.readings == undefined)}), 'label': 'Reading ',
                                     'tableEntry': readingsFull,
                                     'tableEntryMarker': ((item) => ''),
                                     'tooltipEntry': readingsFull,
                                     'sortkey': ((item) => {return 0}),
                                     'sortOrder': 'Ascending',
                                     'sortkey2': ((item) => {return 0}),
                                     'sortOrder2': 'Ascending',
                                     'title': 'Reading',
                                     'labelExport': '',
                                     'needQuotes': true,
                                     'freeFormText': false,
                                     'export': readingsFull,
                                     'isDate': false, 'isList': true,
                                    },
                    'Reading_by_Type': {'exists': ((item) => {return item.object === 'kanji' || item.object === 'vocabulary'}), 'label': 'Rd.&nbsp;Type',
                                        'tooltipEntry': readingByType,
                                        'title': 'Readings by Type',
                                        'labelExport': '',
                                        'needQuotes': true,
                                        'freeFormText': false,
                                        'export': readingByType,
                                        'isDate': false, 'isList': true,
                                       },
                    'Level': {'exists': ((item) => {return true}), 'label': 'Level ',
                              'tableEntry': ((item) => {return item.data.level}),
                              'tableEntryMarker': ((item) => {return item.data.level}),
                              'tooltipEntry': ((item) => {return item.data.level}),
                              'sortkey': ((item) => {return item.data.level}),
                              'sortOrder': 'Ascending',
                              'sortkey2': ((item) => {return (item.assignments != undefined ? (item.assignments.srs_stage != undefined ? item.assignments.srs_stage : 10) : 10)}),
                              'sortOrder2': 'Ascending',
                              'title': 'Level',
                              'labelExport': 'Level: ',
                              'needQuotes': false,
                              'freeFormText': false,
                              'export': ((item) => {return item.data.level}),
                              'isDate': false, 'isList': false,
                             },
                    'Srs': {'exists': ((item) => {return true}), 'label': 'SRS ',
                            'tableEntry': ((item) => {return (item.assignments != undefined ? (item.assignments.srs_stage != undefined ? srsName[item.assignments.srs_stage] : 'Locked') : 'Locked')}),
                            'tableEntryMarker': ((item) => {return (item.assignments != undefined ? (item.assignments.srs_stage != undefined ? srsName[item.assignments.srs_stage] : 'Locked') : 'Locked')}),
                            'tooltipEntry': ((item) => {return (item.assignments != undefined ? (item.assignments.srs_stage != undefined ? srsName[item.assignments.srs_stage] : 'Locked') : 'Locked')}),
                            'sortkey': ((item) => {return (item.assignments != undefined ? (item.assignments.srs_stage != undefined ? item.assignments.srs_stage : 10) : 10)}),
                            'sortOrder': 'Ascending',
                            'sortkey2': ((item) => {return (item.assignments != undefined ? (item.assignments.available_at != undefined ? Date.parse(item.assignments.available_at) : theFuture) : theFuture)}),
                            'sortOrder2': 'Ascending',
                            'title': 'SRS',
                            'labelExport': 'SRS: ',
                            'needQuotes': false,
                            'freeFormText': false,
                            'export': ((item) => {return (item.assignments != undefined ? (item.assignments.srs_stage != undefined ? srsName[item.assignments.srs_stage] : 'Locked') : 'Locked')}),
                            'isDate': false, 'isList': false,
                           },

                      // ----------------------------
                      // Statistics

                    'Leech': {'exists': ((item) => {return true}), 'label': 'Leech ',
                              'tableEntry': leechScore,
                              'tableEntryMarker': leechScore,
                              'tooltipEntry': leechScore,
                              'tableEntryMarker': leechScore,
                              'sortkey': leechScore,
                              'sortOrder': 'Descending',
                              'sortkey2': ((item) => {return (item.review_statistics ? item.review_statistics.percentage_correct : infinity)}),
                              'sortOrder2': 'Ascending',
                              'wordCloud': ((item) => {return Math.round(leechScore(item))}),
                              'title': 'Leech',
                              'labelExport': 'Leech: ',
                              'freeFormText': false,
                              'needQuotes': true,
                              'export': ((item)=>leechScore(item).toLocaleString()),
                              'isDate': false, 'isList': false,
                             },
                    'Total_Incorrect_Answers': {'exists': ((item) => {return true}), 'label': 'Tot.&nbsp;Incor. ',
                                                'tableEntry': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_incorrect + (item.object !== 'radical' ? item.review_statistics.reading_incorrect : 0) : 'Unavailable')}),
                                                'tableEntryMarker': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_incorrect + (item.object !== 'radical' ? item.review_statistics.reading_incorrect : 0) : 'Unavailable')}),
                                                'tooltipEntry':  ((item) => {return (item.review_statistics ? item.review_statistics.meaning_incorrect + (item.object !== 'radical' ? item.review_statistics.reading_incorrect : 0) : 'Unavailable')}),
                                                'sortkey': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_incorrect + (item.object !== 'radical' ? item.review_statistics.reading_incorrect : 0) : infinity)}),
                                                'sortOrder': 'Descending',
                                                'sortkey2': leechScore,
                                                'sortOrder2': 'Descending',
                                                'wordCloud': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_incorrect + (item.object !== 'radical' ? item.review_statistics.reading_incorrect : 0) : 'Unavailable')}),
                                                'title': 'Total Incor.',
                                                'labelExport': 'Total Incor: ',
                                                'needQuotes': false,
                                                'freeFormText': false,
                                                'export': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_incorrect + (item.object !== 'radical' ? item.review_statistics.reading_incorrect : 0) : 'Unavailable')}),
                                                'isDate': false, 'isList': false,
                                               },
                    'Total_Correct_Answers': {'exists': ((item) => {return true}), 'label': 'Tot.&nbsp;Cor. ',
                                              'tableEntry': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_correct + (item.object !== 'radical' ? item.review_statistics.reading_correct: 0) : 'Unavailable')}),
                                              'tableEntryMarker': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_correct + (item.object !== 'radical' ? item.review_statistics.reading_correct: 0) : 'Unavailable')}),
                                              'tooltipEntry':  ((item) => {return (item.review_statistics ? item.review_statistics.meaning_correct + (item.object !== 'radical' ? item.review_statistics.reading_correct: 0) : 'Unavailable')}),
                                              'sortkey': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_correct + (item.object !== 'radical' ? item.review_statistics.reading_correct: 0) : infinity)}),
                                              'sortOrder': 'Ascending',
                                              'sortkey2': leechScore,
                                              'sortOrder2': 'Descending',
                                              'wordCloud': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_correct + (item.object !== 'radical' ? item.review_statistics.reading_correct: 0) : 'Unavailable')}),
                                              'title': 'Total Cor.',
                                              'needQuotes': false,
                                              'freeFormText': false,
                                              'labelExport': 'Total Cor: ',
                                              'export': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_correct + (item.object !== 'radical' ? item.review_statistics.reading_correct: 0) : 'Unavailable')}),
                                              'isDate': false, 'isList': false,
                                             },
                    'Percentage_Correct': {'exists': ((item) => {return true}), 'label': '%Total ',
                                           'tableEntry': ((item) => {return (item.review_statistics ? item.review_statistics.percentage_correct+'%' : 'Unavailable')}),
                                           'tableEntryMarker': ((item) => {return (item.review_statistics ? item.review_statistics.percentage_correct+'%' : 'Unavailable')}),
                                           'tooltipEntry':  ((item) => {return (item.review_statistics ? item.review_statistics.percentage_correct+'%' : 'Unavailable')}),
                                           'sortkey': ((item) => {return (item.review_statistics ? item.review_statistics.percentage_correct : infinity)}),
                                           'sortOrder': 'Ascending',
                                           'sortkey2': leechScore,
                                           'sortOrder2': 'Descending',
                                           'wordCloud': ((item) => {return (item.review_statistics ? item.review_statistics.percentage_correct : 0)}),
                                           'title': '%Total',
                                           'labelExport': '%Total: ',
                                           'needQuotes': false,
                                           'freeFormText': false,
                                           'export': ((item) => {return (item.review_statistics ? item.review_statistics.percentage_correct+'%' : 'Unavailable')}),
                                           'isDate': false, 'isList': false,
                                          },
                    'Meaning_Correct': {'exists': ((item) => {return true}), 'label': '%Meaning ',
                                        'tableEntry': ((item) => {return (item.review_statistics ? MeaningCorrect(item)+'%' : 'Unavailable')}),
                                        'tableEntryMarker': ((item) => {return (item.review_statistics ? MeaningCorrect(item)+'%' : 'Unavailable')}),
                                        'tooltipEntry':  ((item) => {return (item.review_statistics ? MeaningCorrect(item)+'%' : 'None')}),
                                        'sortkey': ((item) => {return (item.review_statistics ? MeaningCorrect(item) : infinity)}),
                                        'sortOrder': 'Ascending',
                                        'sortkey2': leechScore,
                                        'sortOrder2': 'Descending',
                                        'title': '%Meaning',
                                        'labelExport': '%Meaning: ',
                                        'needQuotes': false,
                                        'freeFormText': false,
                                        'export': ((item) => {return (item.review_statistics ? MeaningCorrect(item)+'%' : 'Unavailable')}),
                                        'isDate': false, 'isList': false,
                                       },
                    'Reading_Correct': {'exists': ((item) => {return item.object !== 'radical'}), 'label': '%Reading ',
                                        'tableEntry': ((item) => {return (item.review_statistics ? ReadingCorrect(item)+'%' : 'Unavailable')}),
                                        'tableEntryMarker': ((item) => {return (item.review_statistics ? ReadingCorrect(item)+'%' : 'Unavailable')}),
                                        'tooltipEntry':  ((item) => {return (item.review_statistics ? ReadingCorrect(item)+'%' : 'Unavailable')}),
                                        'sortkey': ((item) => {return (item.review_statistics ? ReadingCorrect(item) : infinity)}),
                                        'sortOrder': 'Ascending',
                                        'sortkey2': leechScore,
                                        'sortOrder2': 'Descending',
                                        'wordCloud': ((item) => {return (item.review_statistics ? ReadingCorrect(item) : 0)}),
                                        'title': '%Reading',
                                        'labelExport': '%Reading: ',
                                        'needQuotes': false,
                                        'freeFormText': false,
                                        'export': ((item) => {return (item.review_statistics ? ReadingCorrect(item)+'%' : 'Unavailable')}),
                                        'isDate': false, 'isList': false,
                                       },
                    'Percentage_Incorrect': {'exists': ((item) => {return true}), 'label': '%Inc.&nbsp;Total ',
                                           'tableEntry': ((item) => {return (item.review_statistics ? (100 - item.review_statistics.percentage_correct)+'%' : 'Unavailable')}),
                                           'tableEntryMarker': ((item) => {return (item.review_statistics ? (100 - item.review_statistics.percentage_correct)+'%' : 'Unavailable')}),
                                           'tooltipEntry':  ((item) => {return (item.review_statistics ? (100 - item.review_statistics.percentage_correct)+'%' : 'Unavailable')}),
                                           'sortkey': ((item) => {return (item.review_statistics ? (100 - item.review_statistics.percentage_correct) : infinity)}),
                                           'sortOrder': 'Descending',
                                           'sortkey2': leechScore,
                                           'sortOrder2': 'Descending',
                                           'wordCloud': ((item) => {return (item.review_statistics ? (100 - item.review_statistics.percentage_correct) : 0)}),
                                           'title': '%Inc. Total',
                                           'labelExport': '%Inc. Total: ',
                                           'needQuotes': false,
                                           'freeFormText': false,
                                           'export': ((item) => {return (item.review_statistics ? (100 - item.review_statistics.percentage_correct)+'%' : 'Unavailable')}),
                                           'isDate': false, 'isList': false,
                                          },
                    'Meaning_Incorrect': {'exists': ((item) => {return true}), 'label': '%Inc.&nbsp;Meaning ',
                                        'tableEntry': ((item) => {return (item.review_statistics ? (100 - MeaningCorrect(item))+'%' : 'Unavailable')}),
                                        'tableEntryMarker': ((item) => {return (item.review_statistics ? (100 - MeaningCorrect(item))+'%' : 'Unavailable')}),
                                        'tooltipEntry':  ((item) => {return (item.review_statistics ? (100 - MeaningCorrect(item))+'%' : 'None')}),
                                        'sortkey': ((item) => {return (item.review_statistics ? (100 - MeaningCorrect(item)) : infinity)}),
                                        'sortOrder': 'Descending',
                                        'sortkey2': leechScore,
                                        'sortOrder2': 'Descending',
                                        'title': '%Inc. Meaning',
                                        'labelExport': '%Inc. Meaning: ',
                                        'needQuotes': false,
                                        'freeFormText': false,
                                        'export': ((item) => {return (item.review_statistics ? (100 - MeaningCorrect(item))+'%' : 'Unavailable')}),
                                        'isDate': false, 'isList': false,
                                       },
                    'Reading_Incorrect': {'exists': ((item) => {return item.object !== 'radical'}), 'label': '%Inc.&nbsp;Reading ',
                                        'tableEntry': ((item) => {return (item.review_statistics ? (100 - ReadingCorrect(item))+'%' : 'Unavailable')}),
                                        'tableEntryMarker': ((item) => {return (item.review_statistics ? (100 - ReadingCorrect(item))+'%' : 'Unavailable')}),
                                        'tooltipEntry':  ((item) => {return (item.review_statistics ? (100 - ReadingCorrect(item))+'%' : 'Unavailable')}),
                                        'sortkey': ((item) => {return (item.review_statistics ? (100 - ReadingCorrect(item)) : infinity)}),
                                        'sortOrder': 'Descending',
                                        'sortkey2': leechScore,
                                        'sortOrder2': 'Descending',
                                        'wordCloud': ((item) => {return (item.review_statistics ? (100 - ReadingCorrect(item)) : 0)}),
                                        'title': '%Inc. Reading',
                                        'labelExport': '%Inc. Reading: ',
                                        'needQuotes': false,
                                        'freeFormText': false,
                                        'export': ((item) => {return (item.review_statistics ? (100 - ReadingCorrect(item))+'%' : 'Unavailable')}),
                                        'isDate': false, 'isList': false,
                                       },
                    'Meaning_Incorrect_Answers': {'exists': ((item) => {return true}), 'label': 'Mg&nbsp;Incor. ',
                                                  'tableEntry': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_incorrect : 'Unavailable')}),
                                                  'tableEntryMarker': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_incorrect : 'Unavailable')}),
                                                  'tooltipEntry':  ((item) => {return (item.review_statistics ? item.review_statistics.meaning_incorrect : 'Unavailable')}),
                                                  'sortkey': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_incorrect : infinity)}),
                                                  'sortOrder': 'Descending',
                                                  'sortkey2': leechScore,
                                                  'sortOrder2': 'Descending',
                                                  'wordCloud': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_incorrect : 'Unavailable')}),
                                                  'title': 'Meaning Incor.',
                                                  'labelExport': 'Meaning Incor: ',
                                                  'needQuotes': false,
                                                  'freeFormText': false,
                                                  'export': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_incorrect : 'Unavailable')}),
                                                  'isDate': false, 'isList': false,
                                                 },
                    'Meaning_Correct_Answers': {'exists': ((item) => {return true}), 'label': 'Mg&nbsp;Cor. ',
                                                'tableEntry': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_correct : 'Unavailable')}),
                                                'tableEntryMarker': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_correct : 'Unavailable')}),
                                                'tooltipEntry':  ((item) => {return (item.review_statistics ? item.review_statistics.meaning_correct : 'Unavailable')}),
                                                'sortkey': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_correct : infinity)}),
                                                'sortOrder': 'Ascending',
                                                'sortkey2': leechScore,
                                                'sortOrder2': 'Descending',
                                                'wordCloud': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_correct : 'Unavailable')}),
                                                'title': 'Meaning Cor.',
                                                'labelExport': 'Meaning Cor: ',
                                                'needQuotes': false,
                                                'freeFormText': false,
                                                'export': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_correct : 'Unavailable')}),
                                                'isDate': false, 'isList': false,
                                               },
                    'Meaning_Current_Streak': {'exists': ((item) => {return true}), 'label': 'Mg&nbsp;Cur.&nbsp;Str. ',
                                               'tableEntry': ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.meaning_current_streak - 1, 0) : 'Unavailable')}),
                                               'tableEntryMarker': ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.meaning_current_streak - 1, 0) : 'Unavailable')}),
                                               'tooltipEntry':  ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.meaning_current_streak - 1, 0) : 'Unavailable')}),
                                               'sortkey': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_current_streak : infinity)}),
                                               'sortOrder': 'Ascending',
                                               'sortkey2': leechScore,
                                               'sortOrder2': 'Descending',
                                               'wordCloud': ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.meaning_current_streak - 1, 0): 'Unavailable')}),
                                               'title': 'Meaning Cur. Str.',
                                               'labelExport': 'Meaning Cur. Str: ',
                                               'needQuotes': false,
                                               'freeFormText': false,
                                               'export': ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.meaning_current_streak - 1, 0) : 'Unavailable')}),
                                               'isDate': false, 'isList': false,
                                              },
                    'Meaning_Max_Streak': {'exists': ((item) => {return true}), 'label': 'Mg&nbsp;Max.&nbsp;Str. ',
                                           'tableEntry': ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.meaning_max_streak - 1, 0) : 'Unavailable')}),
                                           'tableEntryMarker': ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.meaning_max_streak - 1, 0) : 'Unavailable')}),
                                           'tooltipEntry':  ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.meaning_max_streak - 1, 0) : 'Unavailable')}),
                                           'sortkey': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_max_streak : infinity)}),
                                           'sortOrder': 'Ascending',
                                           'sortkey2': leechScore,
                                           'sortOrder2': 'Descending',
                                           'wordCloud': ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.meaning_max_streak - 1, 0) : 'Unavailable')}),
                                           'title': 'Meaning Max. Str.',
                                           'labelExport': 'Meaning Max. Str: ',
                                           'needQuotes': false,
                                           'freeFormText': false,
                                           'export': ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.meaning_max_streak - 1, 0) : 'Unavailable')}),
                                           'isDate': false, 'isList': false,
                                          },
                    'Reading_Incorrect_Answers': {'exists': ((item) => {return item.object !== 'radical'}), 'label': 'Rg&nbsp;Incor. ',
                                                  'tableEntry': ((item) => {return (item.review_statistics ? item.review_statistics.reading_incorrect : 'Unavailable')}),
                                                  'tableEntryMarker': ((item) => {return (item.review_statistics ? item.review_statistics.reading_incorrect : 'Unavailable')}),
                                                  'tooltipEntry':  ((item) => {return (item.review_statistics ? item.review_statistics.reading_incorrect : 'Unavailable')}),
                                                  'sortkey': ((item) => {return (item.review_statistics ? item.review_statistics.reading_incorrect : infinity)}),
                                                  'sortOrder': 'Descending',
                                                  'sortkey2': leechScore,
                                                  'sortOrder2': 'Descending',
                                                  'wordCloud': ((item) => {return (item.review_statistics ? item.review_statistics.reading_incorrect : 'Unavailable')}),
                                                  'title': 'Reading Incor.',
                                                  'labelExport': 'Reading Incor: ',
                                                  'needQuotes': false,
                                                  'freeFormText': false,
                                                  'export': ((item) => {return (item.review_statistics ? item.review_statistics.reading_incorrect : 'Unavailable')}),
                                                  'isDate': false, 'isList': false,
                                                 },
                    'Reading_Correct_Answers': {'exists': ((item) => {return item.object !== 'radical'}), 'label': 'Rg&nbsp;Cor. ',
                                                'tableEntry': ((item) => {return (item.review_statistics ? item.review_statistics.reading_correct : 'Unavailable')}),
                                                'tableEntryMarker': ((item) => {return (item.review_statistics ? item.review_statistics.reading_correct : 'Unavailable')}),
                                                'tooltipEntry':  ((item) => {return (item.review_statistics ? item.review_statistics.reading_correct : 'Unavailable')}),
                                                'sortkey': ((item) => {return (item.review_statistics ? item.review_statistics.reading_correct : infinity)}),
                                                'sortOrder': 'Ascending',
                                                'sortkey2': leechScore,
                                                'sortOrder2': 'Descending',
                                                'wordCloud': ((item) => {return (item.review_statistics ? item.review_statistics.reading_correct : 'Unavailable')}),
                                                'title': 'Reading Cor.',
                                                'labelExport': 'Reading Cor: ',
                                                'needQuotes': false,
                                                'freeFormText': false,
                                                'export': ((item) => {return (item.review_statistics ? item.review_statistics.reading_correct : 'Unavailable')}),
                                                'isDate': false, 'isList': false,
                                               },
                    'Reading_Current_Streak': {'exists': ((item) => {return item.object !== 'radical'}), 'label': 'Rg&nbsp;Cur.&nbsp;Str. ',
                                               'tableEntry': ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.reading_current_streak - 1, 0) : 'Unavailable')}),
                                               'tableEntryMarker': ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.reading_current_streak - 1, 0) : 'Unavailable')}),
                                               'tooltipEntry':  ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.reading_current_streak - 1, 0) : 'Unavailable')}),
                                               'sortkey': ((item) => {return (item.review_statistics ? item.review_statistics.reading_current_streak : infinity)}),
                                               'sortOrder': 'Ascending',
                                               'sortkey2': leechScore,
                                               'sortOrder2': 'Descending',
                                               'wordCloud': ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.reading_current_streak - 1, 0) : 'Unavailable')}),
                                               'title': 'Reading Cur. Str.',
                                               'labelExport': 'Reading Cur. Str: ',
                                               'needQuotes': false,
                                               'freeFormText': false,
                                               'export': ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.reading_current_streak - 1, 0) : 'Unavailable')}),
                                               'isDate': false, 'isList': false,
                                              },
                    'Reading_Max_Streak': {'exists': ((item) => {return item.object !== 'radical'}), 'label': 'Rg&nbsp;Max.&nbsp;Str. ',
                                           'tableEntry': ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.reading_max_streak - 1, 0) : 'Unavailable')}),
                                           'tableEntryMarker': ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.reading_max_streak - 1, 0) : 'Unavailable')}),
                                           'tooltipEntry':  ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.reading_max_streak - 1, 0) : 'Unavailable')}),
                                           'sortkey': ((item) => {return (item.review_statistics ? item.review_statistics.reading_max_streak : infinity)}),
                                           'sortOrder': 'Ascending',
                                           'sortkey2': leechScore,
                                           'sortOrder2': 'Descending',
                                           'wordCloud': ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.reading_max_streak - 1, 0) : 'Unavailable')}),
                                           'title': 'Reading Max. Str.',
                                           'labelExport': 'Reading Max. Str: ',
                                           'needQuotes': false,
                                           'freeFormText': false,
                                           'export': ((item) => {return (item.review_statistics ? Math.max(item.review_statistics.reading_max_streak - 1, 0) : 'Unavailable')}),
                                           'isDate': false, 'isList': false,
                                          },
                    'Minimum_Current_Streak': {'exists': ((item) => {return true}), 'label': 'Min&nbsp;Cur.&nbsp;Str. ',
                                               'tableEntry': ((item) => {return (item.review_statistics ? Math.max(Math.min(item.review_statistics.reading_current_streak, item.review_statistics.meaning_current_streak) - 1, 0) : 'Unavailable')}),
                                               'tableEntryMarker': ((item) => {return (item.review_statistics ? Math.max(Math.min(item.review_statistics.reading_current_streak, item.review_statistics.meaning_current_streak) - 1, 0) : 'Unavailable')}),
                                               'tooltipEntry':  ((item) => {return (item.review_statistics ? Math.max(Math.min(item.review_statistics.reading_current_streak, item.review_statistics.meaning_current_streak) - 1, 0) : 'Unavailable')}),
                                               'sortkey': ((item) => {return (item.review_statistics ? Math.min(item.review_statistics.reading_current_streak, item.review_statistics.meaning_current_streak) : infinity)}),
                                               'sortOrder': 'Ascending',
                                               'sortkey2': leechScore,
                                               'sortOrder2': 'Descending',
                                               'wordCloud': ((item) => {return (item.review_statistics ? Math.max(Math.min(item.review_statistics.reading_current_streak, item.review_statistics.meaning_current_streak) - 1, 0) : 'Unavailable')}),
                                               'title': 'Minimum Cur. Str.',
                                               'labelExport': 'Minimum Cur. Str: ',
                                               'needQuotes': false,
                                               'freeFormText': false,
                                               'export': ((item) => {return (item.review_statistics ? Math.max(Math.min(item.review_statistics.reading_current_streak, item.review_statistics.meaning_current_streak) - 1, 0) : 'Unavailable')}),
                                               'isDate': false, 'isList': false,
                                              },
                    'Review_Count': {'exists': ((item) => {return true}), 'label': 'Nb&nbsp;of&nbsp;Reviews ',
                                              'tableEntry': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_correct + (item.object !== 'radical' ? item.review_statistics.reading_correct: 0) : 'None')}),
                                              'tableEntryMarker': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_correct + (item.object !== 'radical' ? item.review_statistics.reading_correct: 0) : 'None')}),
                                              'tooltipEntry':  ((item) => {return (item.review_statistics ? item.review_statistics.meaning_correct + (item.object !== 'radical' ? item.review_statistics.reading_correct: 0) : 'None')}),
                                              'sortkey': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_correct + (item.object !== 'radical' ? item.review_statistics.reading_correct: 0) : infinity)}),
                                              'sortOrder': 'Ascending',
                                              'sortkey2': leechScore,
                                              'sortOrder2': 'Descending',
                                              'wordCloud': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_correct + (item.object !== 'radical' ? item.review_statistics.reading_correct: 0) : 'None')}),
                                              'title': 'Nb Reviews',
                                              'needQuotes': false,
                                              'freeFormText': false,
                                              'labelExport': 'Nb Reviews: ',
                                              'export': ((item) => {return (item.review_statistics ? item.review_statistics.meaning_correct + (item.object !== 'radical' ? item.review_statistics.reading_correct: 0) : 'None')}),
                                              'isDate': false, 'isList': false,
                                             },

                      // ----------------------------
                      // Dates

                    'Last_Review_Date': {'exists': ((item) => {return true}), 'label': 'Last&nbsp;Review ',
                                    'tableEntry': ((item) => {return (item.assignments != undefined ? (item.assignments.available_at != undefined ? makeLastReview(item) : 'Not yet') : 'Not yet')}),
                                    'tableEntryMarker': ((item) => {return (item.assignments != undefined ? (item.assignments.available_at != undefined ? makeLastReviewMarker(item) : 'Not yet') : 'Not yet')}),
                                    'tooltipEntry': ((item) => {return (item.assignments != undefined ? (item.assignments.available_at != undefined ? makeLastReview(item) : 'Not yet') : 'Not yet')}),
                                    'sortkey': ((item) => {return (item.assignments != undefined ? (item.assignments.available_at != undefined ? makeLastReviewSortKey(item, false) : theFuture) : theFuture)}),
                                    'sortOrder': 'Ascending',
                                    'sortkey2': ((item) => {return (item.assignments != undefined ? (item.assignments.srs_stage != undefined? item.assignments.srs_stage : 10) : 10)}),
                                    'sortOrder2': 'Ascending',
                                    'preciseSortkey': ((item) => {return (item.assignments != undefined ? (item.assignments.available_at != undefined ? makeLastReviewSortKey(item, true) : theFuture) : theFuture)}),
                                    'title': 'Last Review',
                                    'labelExport': 'Last Review: ',
                                    'needQuotes': false,
                                    'freeFormText': false,
                                    'export': ((item) => {return (item.assignments != undefined ? (item.assignments.available_at != undefined ? makeLastReviewForExport(item) : 'Not yet') : 'Not yet')}),
                                    'isDate': true, 'isList': false,
                                   },
                    'Review_Date': {'exists': ((item) => {return true}), 'label': 'Next&nbsp;Review ',
                                    'tableEntry': ((item) => {return (item.assignments != undefined ? (item.assignments.available_at != undefined ? makeDate(item) : 'Unscheduled') : 'Unscheduled')}),
                                    'tableEntryMarker': ((item) => {return (item.assignments != undefined ? (item.assignments.available_at != undefined ? makeDateMarker(item) : 'Unscheduled') : 'Unscheduled')}),
                                    'tooltipEntry': ((item) => {return (item.assignments != undefined ? (item.assignments.available_at != undefined ? makeDate(item) : 'Unscheduled') : 'Unscheduled')}),
                                    'sortkey': ((item) => {return (item.assignments != undefined ? (item.assignments.available_at != undefined ? trimDate(Date.parse(item.assignments.available_at)) : theFuture) : theFuture)}),
                                    'sortOrder': 'Ascending',
                                    'sortkey2': ((item) => {return (item.assignments != undefined ? (item.assignments.srs_stage != undefined? item.assignments.srs_stage : 10) : 10)}),
                                    'sortOrder2': 'Ascending',
                                    'preciseSortkey': ((item) => {return (item.assignments != undefined ? (item.assignments.available_at != undefined ? Date.parse(item.assignments.available_at) : theFuture) : theFuture)}),
                                    'title': 'Review Date',
                                    'labelExport': 'Review Date: ',
                                    'needQuotes': false,
                                    'freeFormText': false,
                                    'export': ((item) => {return (item.assignments != undefined ? (item.assignments.available_at != undefined ? forExportDate(item.assignments.available_at) : 'Unscheduled') : 'Unscheduled')}),
                                    'isDate': true, 'isList': false,
                                   },
                    'Review_Wait': {'exists': ((item) => {return true}), 'label': 'Wait ',
                                    'tableEntry': ((item) => {return (item.assignments != undefined ? (item.assignments.available_at != undefined ? reviewWait(item) : 'Unscheduled') : 'Unscheduled')}),
                                    'tableEntryMarker': ((item) => {return (item.assignments != undefined ? (item.assignments.available_at != undefined ? reviewWait(item) : 'Unscheduled') : 'Unscheduled')}),
                                    'tooltipEntry': ((item) => {return (item.assignments != undefined ? (item.assignments.available_at != undefined ? reviewWait(item) : 'Unscheduled') : 'Unscheduled')}),
                                    'sortkey': ((item) => {return (item.assignments != undefined ? (item.assignments.available_at != undefined ? trimDate(Date.parse(item.assignments.available_at)) : theFuture) : theFuture)}),
                                    'sortOrder': 'Ascending',
                                    'sortkey2': ((item) => {return (item.assignments != undefined ? (item.assignments.srs_stage != undefined? item.assignments.srs_stage : 10) : 10)}),
                                    'sortOrder2': 'Ascending',
                                    'preciseSortkey': ((item) => {return (item.assignments != undefined ? (item.assignments.available_at != undefined ? Date.parse(item.assignments.available_at) : theFuture) : theFuture)}),
                                    'title': 'Wait',
                                    'labelExport': 'Wait: ',
                                    'needQuotes': false,
                                    'freeFormText': false,
                                    'export': ((item) => 'None'),
                                    'isDate': true, 'isList': false,
                                   },
                    'Passed_Date': {'exists': ((item) => {return true}), 'label': 'Passed ',
                                    'tableEntry': ((item) => {return (item.assignments != undefined ? (item.assignments.passed_at != undefined ? makePassedDate(item) : 'Not yet') : 'Not yet')}),
                                    'tableEntryMarker': ((item) => {return (item.assignments != undefined ? (item.assignments.passed_at != undefined ? makePassedDateMarker(item) : 'Not yet') : 'Not yet')}),
                                    'tooltipEntry': ((item) => {return (item.assignments != undefined ? (item.assignments.passed_at != undefined ? makePassedDate(item) : 'Not yet') : 'Not yet')}),
                                    'sortkey': ((item) => {return (item.assignments != undefined ? (item.assignments.passed_at != undefined ? trimDate(Date.parse(item.assignments.passed_at)) : 0) : 0)}),
                                    'sortOrder': 'Ascending',
                                    'sortkey2': ((item) => {return (item.assignments != undefined ? (item.assignments.srs_stage != undefined ? item.assignments.srs_stage : 10) : 10)}),
                                    'sortOrder2': 'Ascending',
                                    'preciseSortkey': ((item) => {return (item.assignments != undefined ? (item.assignments.passed_at != undefined ? Date.parse(item.assignments.passed_at) : theFuture) : theFuture)}),
                                    'title': 'Passed Guru',
                                    'labelExport': 'Passed Guru: ',
                                    'needQuotes': false,
                                    'freeFormText': false,
                                    'export': ((item) => {return (item.assignments != undefined ? (item.assignments.passed_at != undefined ? forExportDate(item.assignments.passed_at) : 'Not yet') : 'Not yet')}),
                                    'isDate': true, 'isList': false,
                                   },
                    'Burned_Date': {'exists': ((item) => {return true}), 'label': 'Burned ',
                                    'tableEntry': ((item) => {return (item.assignments != undefined ? (item.assignments.burned_at != undefined ? makeBurnedDate(item) : 'Not yet') : 'Not yet')}),
                                    'tableEntryMarker': ((item) => {return (item.assignments != undefined ? (item.assignments.burned_at != undefined ? makeBurnedDateMarker(item) : 'Not yet') : 'Not yet')}),
                                    'tooltipEntry': ((item) => {return (item.assignments != undefined ? (item.assignments.burned_at != undefined ? makeBurnedDate(item) : 'Not yet') : 'Not yet')}),
                                    'sortkey': ((item) => {return (item.assignments != undefined ? (item.assignments.burned_at != undefined ? trimDate(Date.parse(item.assignments.burned_at)) : 0) : 0)}),
                                    'sortOrder': 'Ascending',
                                    'sortkey2': ((item) => {return item.data.level}),
                                    'sortOrder2': 'Ascending',
                                    'preciseSortkey': ((item) => {return (item.assignments != undefined ? (item.assignments.burned_at != undefined ? Date.parse(item.assignments.burned_at) : theFuture) : theFuture)}),
                                    'title': 'Burned',
                                    'labelExport': 'Burned: ',
                                    'needQuotes': false,
                                    'freeFormText': false,
                                    'export': ((item) => {return (item.assignments != undefined ? (item.assignments.burned_at != undefined ? forExportDate(item.assignments.burned_at) : 'Not yet') : 'Not yet')}),
                                    'isDate': true, 'isList': false,
                                   },
                    'Resurrected_Date': {'exists': ((item) => {return true}), 'label': 'Resurrected ',
                                         'tableEntry': ((item) => {return (item.assignments != undefined ? (item.assignments.resurrected_at != undefined ? makeResurrectedDate(item) : 'Not yet') : 'Not yet')}),
                                         'tableEntryMarker': ((item) => {return (item.assignments != undefined ? (item.assignments.resurrected_at != undefined ? makeResurrectedDateMarker(item) : 'Not yet') : 'Not yet')}),
                                         'tooltipEntry': ((item) => {return (item.assignments != undefined ? (item.assignments.resurrected_at != undefined ? makeResurrectedDate(item) : 'Not yet') : 'Not yet')}),
                                         'sortkey': ((item) => {return (item.assignments != undefined ? (item.assignments.resurrected_at != undefined ? trimDate(Date.parse(item.assignments.resurrected_at)).toDateString() : 0) : 0)}),
                                         'sortOrder': 'Ascending',
                                         'sortkey2': ((item) => {return item.data.level}),
                                         'sortOrder2': 'Ascending',
                                         'preciseSortkey': ((item) => {return (item.assignments != undefined ? (item.assignments.resurrected_at != undefined ? Date.parse(item.assignments.resurrected_at).toDateString() : theFuture) : theFuture)}),
                                         'title': 'Resurrected',
                                         'labelExport': 'Resurrected: ',
                                         'needQuotes': false,
                                         'freeFormText': false,
                                         'export': ((item) => {return (item.assignments != undefined ? (item.assignments.resurrected_at != undefined ? forExportDate(item.assignments.resurrected_at) : 'Not yet') : 'Not yet')}),
                                         'isDate': true, 'isList': false,
                                        },
                    'Lesson_Date': {'exists': ((item) => {return true}), 'label': 'Lesson ',
                                    'tableEntry': ((item) => {return (item.assignments != undefined ? (item.assignments.started_at != undefined ? makeLessonDate(item) : 'Not yet') : 'Not yet')}),
                                    'tableEntryMarker': ((item) => {return (item.assignments != undefined ? (item.assignments.started_at != undefined ? makeLessonDateMarker(item) : 'Not yet') : 'Not yet')}),
                                    'tooltipEntry': ((item) => {return (item.assignments != undefined ? (item.assignments.started_at != undefined ? makeLessonDate(item) : 'Not yet') : 'Not yet')}),
                                    'sortkey': ((item) => {return (item.assignments != undefined ? (item.assignments.started_at ? trimDate(Date.parse(item.assignments.started_at)) : theFuture) : theFuture)}),
                                    'sortOrder': 'Ascending',
                                    'sortkey2': ((item) => {return item.data.level}),
                                    'sortOrder2': 'Ascending',
                                    'preciseSortkey': ((item) => {return (item.assignments != undefined ? (item.assignments.started_at ? Date.parse(item.assignments.started_at) : theFuture) : theFuture)}),
                                    'title': 'Lesson',
                                    'labelExport': 'Lesson: ',
                                    'needQuotes': false,
                                    'freeFormText': false,
                                    'export': ((item) => {return (item.assignments != undefined ? (item.assignments.started_at != undefined ? forExportDate(item.assignments.started_at) : 'Not yet') : 'Not yet')}),
                                    'isDate': true, 'isList': false,
                                   },
                    'Unlock_Date': {'exists': ((item) => {return true}), 'label': 'Unlock ',
                                    'tableEntry': ((item) => {return (item.assignments != undefined ? (item.assignments.unlocked_at != undefined ? makeUnlockDate(item) : 'Not yet') : 'Not yet')}),
                                    'tableEntryMarker': ((item) => {return (item.assignments != undefined ? (item.assignments.unlocked_at != undefined ? makeUnlockDateMarker(item) : 'Not yet') : 'Not yet')}),
                                    'tooltipEntry': ((item) => {return (item.assignments != undefined ? (item.assignments.unlocked_at != undefined ? makeUnlockDate(item) : 'Not yet') : 'Not yet')}),
                                    'sortkey': ((item) => {return (item.assignments != undefined ? (item.assignments.unlocked_at ? trimDate(Date.parse(item.assignments.unlocked_at)) : theFuture) : theFuture)}),
                                    'sortOrder': 'Ascending',
                                    'sortkey2': ((item) => {return item.data.level}),
                                    'sortOrder2': 'Ascending',
                                    'preciseSortkey': ((item) => {return (item.assignments != undefined ? (item.assignments.unlocked_at ? Date.parse(item.assignments.unlocked_at) : theFuture) : theFuture)}),
                                    'title': 'Unlock',
                                    'labelExport': 'Unlock: ',
                                    'needQuotes': false,
                                    'freeFormText': false,
                                    'export': ((item) => {return (item.assignments != undefined ? (item.assignments.unlocked_at != undefined ? forExportDate(item.assignments.unlocked_at) : 'Not yet') : 'Not yet')}),
                                    'isDate': true, 'isList': false,
                                   },

                      // ----------------------------
                      // Related Items

                    'Used_In': {'exists': ((item) => {return (item.object === 'radical' || item.object === 'kanji')}), 'label': 'Used&nbsp;In',
                                'title': 'Used In',
                                'labelExport': 'Used In: ',
                                'needQuotes': true,
                                'freeFormText': false,
                                'export': ((item) => {return (item.object === 'radical' ? makeNameListBySubjectKan(item.data.amalgamation_subject_ids) : makeNameListBySubjectVoc(item.data.amalgamation_subject_ids))}),
                                'itemList': ((item)=>{return (item.object === 'radical' ? makeItemListKan(item.data.amalgamation_subject_ids) : makeItemListVoc(item.data.amalgamation_subject_ids))}),
                                'idList': ((item)=>(item.object === 'radical' || item.object === 'kanji' ? item.data.amalgamation_subject_ids : [])),
                                'isDate': false, 'isList': true,
                               },
                    'Components': {'exists': ((item) => {return (item.object === 'kanji' || item.object === 'vocabulary')}), 'label': 'Components',
                                   'title': 'Components',
                                   'labelExport': 'Components: ',
                                   'needQuotes': true,
                                   'freeFormText': false,
                                   'export': ((item) => {return (item.object === 'kanji' ? makeNameListBySubjectRad(item.data.component_subject_ids) : makeNameListBySubjectKan(item.data.component_subject_ids))}),
                                   'itemList': ((item)=>{return (item.object === 'kanji' ? makeItemListRad(item.data.component_subject_ids) : makeItemListKan(item.data.component_subject_ids))}),
                                   'idList': ((item)=>(item.object === 'kanji' || item.object === 'vocabulary' ? item.data.component_subject_ids : [])),
                                   'isDate': false, 'isList': true,
                                  },
                    'Vis_Sim_Kanji': {'exists': ((item) => {return item.object === 'kanji'}), 'label': 'Vis.&nbsp;Sim.&nbsp;WK',
                                      'title': 'Vis. Sim. Kanjis WK',
                                      'labelExport': 'Vis. Sim. Kanjis WK: ',
                                      'needQuotes': true,
                                      'freeFormText': false,
                                      'export': ((item) => {return makeNameListBySubjectKan(item.data.visually_similar_subject_ids)}),
                                      'itemList': ((item)=>{return makeItemListKan(item.data.visually_similar_subject_ids)}),
                                      'idList': ((item)=>(item.object === 'kanji' ? item.data.visually_similar_subject_ids : [])),
                                      'isDate': false, 'isList': true,
                                     },
                    'Lars_Yencken':  {'exists': ((item) => {return item.object === 'kanji'}), 'label': 'Vis.&nbsp;Sim.&nbsp;LY',
                                     'title': 'Vis. Sim. Kanjis LY',
                                     'labelExport': 'Vis. Sim. Kanjis LY: ',
                                     'needQuotes': true,
                                     'freeFormText': false,
                                     'export': ((item) => {return makeListVisSimKan(visuallySimilarData[item.data.characters])}),
                                     'itemList': ((item)=>{return makeItemListVisSimKan(visuallySimilarData[item.data.characters])}),
                                     'idList': ((item)=>{return makeIdListVisSimKan(visuallySimilarData[item.data.characters])}),
                                     'isDate': false, 'isList': true,
                                    },

                      // ----------------------------
                      // Miscellaneous item info

                    'Part_Of_Speech': {'exists': ((item) => {return item.object === 'vocabulary'}), 'label': 'Part&nbsp;of&nbsp;Sp.',
                                       'tooltipEntry':  ((item) => {return item.data.parts_of_speech.join(', ')}),
                                       'title': 'Part of Speech',
                                       'labelExport': 'Part of Speech: ',
                                       'needQuotes': true,
                                       'freeFormText': false,
                                       'export': ((item) => {return item.data.parts_of_speech.join(', ')}),
                                       'isDate': false, 'isList': true,
                                      },
                    'Block_List': {'exists': ((item) => {return true}), 'label': 'Block&nbsp;List',
                                   'tooltipEntry':  ((item) => {return makeAuxMeaningList(item.data.auxiliary_meanings, 'blacklist')}),
                                   'sortkey':  ((item) => {return 0}),
                                   'sortOrder': 'Ascending',
                                   'sortkey2':  ((item) => {return 0}),
                                   'sortOrder2': 'Ascending',
                                   'title': 'Block List',
                                   'labelExport': 'Block List: ',
                                   'needQuotes': true,
                                   'freeFormText': false,
                                   'export': ((item) => {return makeAuxMeaningList(item.data.auxiliary_meanings, 'blacklist')}),
                                   'isDate': false, 'isList': true,
                                  },
                    'Allow_List': {'exists': ((item) => {return true}), 'label': 'Allow&nbsp;List',
                                   'tooltipEntry':  ((item) => {return makeAuxMeaningList(item.data.auxiliary_meanings, 'whitelist')}),
                                   'sortkey':  ((item) => {return 0}),
                                   'sortOrder': 'Ascending',
                                   'sortkey2':  ((item) => {return 0}),
                                   'sortOrder2': 'Ascending',
                                   'title': 'Allow List',
                                   'labelExport': 'Allow List: ',
                                   'needQuotes': true,
                                   'freeFormText': false,
                                   'export': ((item) => {return makeAuxMeaningList(item.data.auxiliary_meanings, 'whitelist')}),
                                   'isDate': false, 'isList': true,
                                  },
                    'Joyo': {'exists': ((item) => {return item.object !== 'radical'}), 'label': 'Joyo',
                                   'tableEntry':  makeJoyoData,
                                   'tableEntryMarker':  makeJoyoData,
                                   'tooltipEntry':  makeJoyoData,
                                   'sortkey':  makeJoyoSortData,
                                   'sortOrder': 'Ascending',
                                   'sortkey2':  ((item) => {return item.data.level}),
                                   'sortOrder2': 'Ascending',
                                   'title': 'Joyo Grade',
                                   'labelExport': 'Joyo Grade: ',
                                   'needQuotes': false,
                                   'freeFormText': false,
                                   'export': makeJoyoData,
                                   'isDate': false, 'isList': true,
                                  },
                    'JLPT': {'exists': ((item) => {return item.object !== 'radical'}), 'label': 'JLPT',
                                   'tableEntry':  makeJlptData,
                                   'tableEntryMarker':  makeJlptData,
                                   'tooltipEntry':  makeJlptData,
                                   'sortkey': makeJlptSortData,
                                   'sortOrder': 'Descending',
                                   'sortkey2':  ((item) => {return item.data.level}),
                                   'sortOrder2': 'Ascending',
                                   'title': 'JLPT',
                                   'labelExport': 'JLPT: ',
                                   'needQuotes': false,
                                   'freeFormText': false,
                                   'export': makeJlptData,
                                   'isDate': false, 'isList': true,
                                  },
                    'Frequency': {'exists': ((item) => {return item.object !== 'radical'}), 'label': 'Frequency',
                                   'tableEntry':  makeFrequencyData,
                                   'tableEntryMarker':  makeFrequencyData,
                                   'tooltipEntry':  makeFrequencyData,
                                   'sortkey': makeFrequencySortData,
                                   'sortOrder': 'Ascending',
                                   'sortkey2':  ((item) => {return item.data.level}),
                                   'sortOrder2': 'Ascending',
                                   'title': 'Frequency',
                                   'labelExport': 'Frequency: ',
                                   'needQuotes': false,
                                   'freeFormText': false,
                                   'export': makeFrequencyData,
                                   'isDate': false, 'isList': true,
                                  },

                    // -------------------------
                    // Export only info

                    'Item_Page': {'exists': ((item) => {return true}),
                                  'title': 'Item Page URL',
                                  'labelExport': '',
                                  'needQuotes': false,
                                  'freeFormText': false,
                                  'export': ((item) => {return item.data.document_url}),
                                  'isDate': false, 'isList': false,
                                 },
                    'Export_Date': {'exists': ((item) => {return true}),
                                    'title': 'Export Date',
                                    'labelExport': 'Export Date: ',
                                    'needQuotes': false,
                                    'freeFormText': false,
                                    'export': ((item) => {return today()}),
                                    'isDate': true, 'isList': false,
                                   },

                    // --------------------------------------------------------
                    // The following data is export only for metadata purposes
                    // They are available in popups through dedicated helper functions for producing popups

                    'mMnemonics': {'exists': ((item) => {return true}),
                                   'title': 'Meaning Mnemonics',
                                   'labelExport': 'Meaning Mnemonic: ',
                                   'needQuotes': true,
                                   'freeFormText': true,
                                   'export': ((item) => {return item.data.meaning_mnemonic}),
                                   'isDate': false, 'isList': false,
                                   },
                    'rMnemonics': {'exists': ((item) => {return item.object !== 'radical'}),
                                   'title': 'Reading Mnemonics',
                                   'labelExport': 'Reading Mnemonic: ',
                                   'needQuotes': true,
                                   'freeFormText': true,
                                   'export': ((item) => {return item.data.reading_mnemonic}),
                                   'isDate': false, 'isList': false,
                                   },
                    'mHints': {'exists': ((item) => {return item.object === 'kanji'}),
                               'title': 'Meaning Hints',
                               'labelExport': 'Meaning Hint: ',
                               'needQuotes': true,
                               'freeFormText': true,
                               'export': ((item) => {return (item.data.meaning_hint !== null ? item.data.meaning_hint : "Unavailable")}),
                               'isDate': false, 'isList': false,
                              },
                    'rHints': {'exists': ((item) => {return item.object === 'kanji'}),
                               'title': 'Reading Hints',
                               'labelExport': 'Reading Hint: ',
                               'needQuotes': true,
                               'freeFormText': true,
                               'export': ((item) => {return (item.data.reading_hint !== null ? item.data.reading_hint : "Unavailable")}),
                               'isDate': false, 'isList': false,
                              },
                    'Context_Sentences': {'exists': ((item) => {return item.object === 'vocabulary'}),
                                          'title': 'Context Sentences',
                                          'labelExport': '',
                                          'needQuotes': true,
                                          'freeFormText': false,
                                          'export': ((item) => {return (item.data.context_sentences && item.data.context_sentences !== 0 ? item.data.context_sentences : "Unavailable")}),
                                          'isDate': false, 'isList': true,
                                          },
                    'mNotes': {'exists': ((item) => {return true}),
                               'title': 'Meaning Notes',
                               'labelExport': 'Meaning Note: ',
                               'needQuotes': true,
                               'freeFormText': true,
                               'export': ((item) => {return (item.study_materials !== undefined ? (item.study_materials.meaning_note ? item.study_materials.meaning_note : 'Unavailable') : 'Unavailable')}),
                               'isDate': false, 'isList': false,
                               },
                    'rNotes': {'exists': ((item) => {return true}),
                               'title': 'Reading Notes',
                               'labelExport': 'Reading Note: ',
                               'needQuotes': true,
                               'freeFormText': true,
                               'export': ((item) => {return (item.study_materials !== undefined ? (item.study_materials.reading_note? item.study_materials.reading_note : 'Unavailable') : 'Unavailable')}),
                               'isDate': false, 'isList': false,
                               },
                    'Synonyms': {'exists': ((item) => {return true}),
                                'title': 'User Synonyms',
                                'labelExport': 'User Synonym: ',
                                'needQuotes': true,
                                'freeFormText': false,
                                'export': ((item) => {return (item.study_materials !== undefined ? (item.study_materials.meaning_synonyms !== null ? item.study_materials.meaning_synonyms.join(', ') : 'Unavailable') : 'Unavailable')}),
                                'isDate': false, 'isList': false,
                                },
                    };
    // ------------------------------
    // end of metadata object
    // ------------------------------

    //===========================================
    // helper functions registered in metadata
    //-------------------------------------------

    function isValidDate(dateString) {
      var regEx = /^\d{4}-\d{2}-\d{2}$/;
      if(!dateString.match(regEx)) return false; // Invalid format
      var d = new Date(dateString);
      var dNum = d.getTime();
      if(!dNum && dNum !== 0) return false; // NaN value, Invalid date
      return d.toISOString().slice(0,10) === dateString;
    }

    function nameItem(item){
        return (item.data.characters === null ? item.data.slug : item.data.characters);
    };

    function makeNameListBySubjectRad(subjectArray){
        if (subjectArray.length === 0)return '-Empty-';
        return subjectArray.map((id) => nameItem(subjectIndexRad[id]));
    }

    function makeNameListBySubjectKan(subjectArray){
        if (subjectArray.length === 0)return '-Empty-';
        return subjectArray.map((id) => nameItem(subjectIndexKan[id]));
    }

    function makeNameListBySubjectVoc(subjectArray){
        if (subjectArray.length === 0)return '-Empty-';
        return subjectArray.map((id) => nameItem(subjectIndexVoc[id]));
    }

    function makeItemListRad(subjectArray){
        if (subjectArray === undefined){return []};
        return subjectArray.map((id) => {return subjectIndexRad[id]});
    }

    function makeItemListKan(subjectArray){
        if (subjectArray === undefined){return []};
        return subjectArray.map((id) => {return subjectIndexKan[id]});
    }

    function makeItemListVoc(subjectArray){
        if (subjectArray === undefined){return []};
        return subjectArray.map((id) => {return subjectIndexVoc[id]});
    }

    function MeaningCorrect(item){
        let stats = item.review_statistics;
        let denominator = stats.meaning_correct + stats.meaning_incorrect;
        if (denominator == 0){
            return 100
        } else {
            return Math.floor(100 * stats.meaning_correct / denominator)
        }
    }

    function ReadingCorrect(item){
        let stats = item.review_statistics;
        let denominator = stats.reading_correct + stats.reading_incorrect;
        if (denominator == 0){
            return 100
        } else {
            return Math.floor(100 * stats.reading_correct / denominator)
        }
    }

    function leechScore(item){
        if (item.review_statistics != undefined){
            let reviewStats = item.review_statistics;
            let meaningScore = getLeechScore(reviewStats.meaning_incorrect, reviewStats.meaning_current_streak);
            let readingScore = getLeechScore(reviewStats.reading_incorrect, reviewStats.reading_current_streak);

            return Math.max(meaningScore, readingScore);
        } else {return 0}
    }

    function getLeechScore(incorrect, currentStreak) {
        //get incorrect number than lessen it using the user's correctStreak
        let leechScore = incorrect / Math.pow((currentStreak || 0.5), 1.5); // '||' => if currentstreak zero make 0.5 instead (prevents dividing by zero)
        leechScore = Math.round(leechScore * 100) / 100; //round to two decimals
        return leechScore;
    }

    function reviewWait(item){
        return (Date.parse(item.assignments.available_at) < Date.now() ? 'Now' : s_to_dhm((Date.parse(item.assignments.available_at)-Date.now())/1000))
    }

    // Converts seconds to days, hours, and minutes
    function s_to_dhm(s) {
        var d = Math.floor(s/60/60/24);
        var h = Math.floor(s%(60*60*24)/60/60);
        var m = Math.ceil(s%(60*60*24)%(60*60)/60);
        return (d>0?d+'d ':'')+(h>0?h+'h ':'')+(m>0?m+'m':'1m');
    }

    function makeDate(item){
        return formatDate(new Date(item.assignments.available_at), true, /* is_next_date */);
    }

    function makeDateMarker(item){
        return formatDateMarker(new Date(item.assignments.available_at), true, /* is_next_date */);
    }

    const regularSrsIntervals = [0, 4, 8, 23, 47, 167, 335, 719, 2879];
    const acceleratedSrsIntervals = [0, 2, 4, 8, 23, 167, 335, 719, 2879];
    const acceleratedLevels = [1, 2];
    function computeLastReviewDate(item){
        let srsStage = item.assignments.srs_stage;
        if (srsStage === 0 || srsStage === 9) return -infinity;
        let srsInvervals = acceleratedLevels.includes(item.data.level) ? acceleratedSrsIntervals : regularSrsIntervals;
		let deltaTime = parseInt(srsInvervals[srsStage]) * 1000 * 60 * 60; // convert hours to in milliseconds
        return new Date(item.assignments.available_at) - deltaTime;
    }

    function makeLastReview(item){
        let lastReviewTime = computeLastReviewDate(item);
        return lastReviewTime === -infinity ? 'Not Yet' : formatDate(new Date(lastReviewTime), false);
    }

    function makeLastReviewMarker(item){
        let lastReviewTime = computeLastReviewDate(item);
        return lastReviewTime === -infinity ? 'Not Yet' : formatDateMarker(new Date(lastReviewTime));
    }

    function makeLastReviewSortKey(item, precise){
        let lastReviewTime = computeLastReviewDate(item);
        return precise ? lastReviewTime : trimDate(lastReviewTime);
    }

    function makeLastReviewForExport(item){
        let lastReviewTime = computeLastReviewDate(item);
        return lastReviewTime === -infinity ? 'Not Yet' : forExportDate(lastReviewTime);
    }

    function makePassedDate(item){
        return formatDate(new Date(item.assignments.passed_at), false, /* is_next_date */);
    }

    function makePassedDateMarker(item){
        return formatDateMarker(new Date(item.assignments.passed_at), false, /* is_next_date */);
    }

    function makeBurnedDate(item){
        return formatDate(new Date(item.assignments.burned_at), false, /* is_next_date */);
    }

    function makeBurnedDateMarker(item){
        return formatDateMarker(new Date(item.assignments.burned_at), false, /* is_next_date */);
    }

    function makeResurrectedDate(item){
        return formatDate(new Date(item.assignments.resurrected_at), false, /* is_next_date */);
    }

    function makeResurrectedDateMarker(item){
        return formatDateMarker(new Date(item.assignments.resurrected_at), false, /* is_next_date */);
    }

    function makeLessonDate(item){
        return formatDate(new Date(item.assignments.started_at), false, /* is_next_date */);
    }

    function makeLessonDateMarker(item){
        return formatDateMarker(new Date(item.assignments.started_at), false, /* is_next_date */);
    }

    function makeUnlockDate(item){
        return formatDate(new Date(item.assignments.unlocked_at), false, /* is_next_date */);
    }

    function makeUnlockDateMarker(item){
        return formatDateMarker(new Date(item.assignments.unlocked_at), false, /* is_next_date */);
    }

    function forExportDate(date) {
        return new Date(date).toISOString().slice(0, 16).replace('T', ' ');
    }

    function formatDateMarker(date) {
        var YY = ''+date.getFullYear(),
            MM = ''+(date.getMonth()+1),
            DD = ''+date.getDate(),
            hh = ''+date.getHours(),
            mm = ''+date.getMinutes();

        if (MM.length < 2) MM = '0' + MM;
        if (DD.length < 2) DD = '0' + DD;
        let s = YY+'-'+MM+'-'+DD;
        if (quiz.settings.tablePresets[quiz.settings.active_ipreset].showHours){
            if (quiz.settings.hoursFormat === '24hours') {
                s += ' '+('0'+hh).slice(-2)+':'+('0'+mm).slice(-2);
            } else {
                s += ' '+(((hh+11)%12)+1)+':'+('0'+mm).slice(-2)+['am','pm'][Math.floor(date.getHours()/12)];
            }
        };
        return s;
    }

    function today() {
        var d = new Date(),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear(),
            hh = '' + d.getHours(),
            mm = '' + d.getMinutes();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        if (hh.length < 2) hh = '0' + hh;
        if (mm.length < 2) mm = '0' + mm;
        return [year, month, day].join('-') + ' ' + hh + ':' + mm;
    }

    //========================================================================
    // Print date in pretty format.
    //-------------------------------------------------------------------
    function formatDate(d, is_next_date, show_year){
        var s = '';
        var now = new Date();
        var YY = d.getFullYear(),
            MM = d.getMonth(),
            DD = d.getDate(),
            hh = d.getHours(),
            mm = d.getMinutes(),
            one_day = 24*60*60*1000;

        if (is_next_date && d < now) return "Available Now";
        var same_day = ((YY == now.getFullYear()) && (MM == now.getMonth()) && (DD == now.getDate()) ? 1 : 0);

        //    If today:  "Today 8:15pm"
        //    otherwise: "Wed, Apr 15, 8:15pm"
        if (same_day) {
            s += 'Today ';
        } else if (show_year){
            s += d.toISOString().slice(10);
        } else {
            s += ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]+', '+
                ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][MM]+' '+DD+', ';
        }
        if (quiz.settings.hoursFormat === '24hours') {
            s += ('0'+hh).slice(-2)+':'+('0'+mm).slice(-2);
        } else {
            s += (((hh+11)%12)+1)+':'+('0'+mm).slice(-2)+['am','pm'][Math.floor(d.getHours()/12)];
        }

        return s;
    }

    //========================================================================
    // Reduce date in milliseconds to minutes boundary
    // This makes secondary sorting match the primary sort data seen by the user
    //------------------------------------------------------------------------
    function trimDate(d){
        return Math.floor((d/1000)/60)*1000*60;
    }

    function meaningsFullTable(item){
        var meanings = meaningsFull(item);
        if (meanings.length > 20){meanings = meanings.slice(0, 20) + '...'}
        return meanings;
    }

    function meaningsFull(item){
        // make sure meanings are returned in the order WK provides them, but primary comes first
        var meanings = "";
        var meaningsPrimary = "";
        for (var k = 0; k < item.data.meanings.length; k++){
            if(item.data.meanings[k].primary){
                if (meaningsPrimary.length != 0){
                    meaningsPrimary += ', ' + item.data.meanings[k].meaning;
                } else {
                    meaningsPrimary = item.data.meanings[k].meaning;
                }
            } else {
                if (meanings.length != 0){
                    meanings += ', ' + item.data.meanings[k].meaning;
                } else {
                    meanings = item.data.meanings[k].meaning;
                }
            }
        }
        if (meanings.length != 0){meaningsPrimary = meaningsPrimary + ', ' + meanings}
        return meaningsPrimary;
    }


    function meaningsBrief(item){
        var meanings = item.data.meanings[0].meaning;
        for (var k = 0; k < item.data.meanings.length; k++){if (item.data.meanings[k].primary){return item.data.meanings[k].meaning}};
        return meanings;
    }

    function makeAuxMeaningList(list, type){
        if (list.length === 0) return '--Empty--';
        let firstElement = true;
        let l = '--Empty--';
        for (var i = 0; i < list.length; i++){
            if (list[i].type === type){
                if (firstElement){
                    l = list[i].meaning;
                    firstElement = false;
                } else {
                    l += ', '+ list[i].meaning;
                };
            };
        };
        return l;
    };

    // -----------------------------------------------------------------
    // data for use with the readingsFull(item, needType=true) algorithm

    // vocabulary readings that are not processed by the algorithm
    // if multiple readings and at least one of them is an exception , all readings must be listed here
    const exceptions = {'一人' : 'ひとり, 一: ひと: kun, 人: り: kun',
                        '二人' : 'ふたり, 二: ふた: kun, 人: り: kun',
                        '一日' : 'いちにち, 一: いち: on, 日: にち: on, &emsp;ついたち : exception',
                        '二日' : 'ふつか, exception',
                        '六日': 'むいか,  六: むい: kun, 日: か: kun',
                        '二十日': 'はつか,  二十: はつ: exception, 日: か: kun',
                        '二十歳': 'はたち: exception',
                        '達する': 'たっする,  達: たつ: on, たち: kun',
                        '２０１１年': 'にせんじゅういちねん, に: on, せん: on, じゅう: on, いち: on, 年: ねん: on',
                        'ビたま': 'ビー玉, 玉: たま: kun',
                        '今日': 'きょう: exception',
                        '今朝': 'けさ: exception',
                        '今年': 'ことし, 今: こ: on, 年: とし: kun',
                        '昨日': 'きのう: exception, &emsp;さくじつ: exception',
                        '一昨日': 'おととい: exception, &emsp;いっさくじつ: exception, &emsp;おとつい: exception',
                        '明日': 'あした, 明: あ: kun, 日: した: exception, &emsp;あす, 明: あ: kun, 日: す: exception, &emsp;みょうにち, 明: みょう: kun, 日: にち: on',
                        '大人': 'おとな: exception',
                        '大人しい': 'おとなしい: exception',
                        '下手': 'へた: exception',
                        '日本': 'にほん, に: on, 本: ほん: on, &emsp;にっぽん, にっ: on, 本: ぽん: on',
                        '日本酒': 'にほんしゅ, 日: に: on, 本: ほん: on, 酒: しゅ: on, &emsp;にっぽんしゅ, 日: にっ: on, 本: ぽん: on, 酒: しゅ: on',
                        '日本語': 'にほんご, 日: に: on, 本: ほん: on, 語: ご: on',
                        '日本的': 'にほんてき, 日: に: on, 本: ほん: on, 的: てき: on',
                        '日本製': 'にほんせい, 日: に: on, 本: ほん: on, 製: せい: on',
                        '全日本': 'ぜんにほん, 全: ぜん: on, 日: に: on, 本: ほん: on, &emsp;ぜんにっぽん, 全: ぜん: on, 日: にっ: on, 本: ぽん: on',
                        '美味しい': 'おいしい, exception',
                        '不味い': 'まずい: exception',
                        'お土産': 'おみやげ: exception',
                        '乳首': 'ちくび,  乳: ち: exception, 首: くび: kun',
                        '台詞': 'せりふ: exception',
                        '景色': 'けしき, 景: け: exception, 色: しき: on',
                        '河豚': 'ふぐ: exception,&emsp; ふく: exception',
                        '何故': 'なぜ: exception',
                        '何故なら': 'なぜなら: exception',
                        '従兄弟': 'いとこ: exception',
                        '火傷': 'やけど: exception, &emsp;かしょう: exception',
                        '小豆': 'あずき: exception',
                        '田舎': 'いなか: exception',
                        '香港': 'ほんこん: exception',
                        '欠伸': 'あくび: exception',
                        '浴衣': 'ゆかた: exception',
                        '相撲': 'すもう: exception',
                        '瞬き': 'まばたき: exception, &emsp;またたき: exception',
                        '化粧': 'けしょう, 化: け: on, 粧: しょう: on',
                        '裸足': 'はだし: exception',
                        '団扇': 'うちわ: exception',
                        '数珠': 'じゅず: exception',
                        '愛媛県': 'えひめけん, 愛: え: exception, 媛: ひめ: kun, 県: けん: on',
                        '会釈': 'えしゃく, 会: え: on, 釈: しゃく: on',
                        '肯く': 'うなずく: exception, &emsp;うなづく: exception',
                        '胡座': 'あぐら: exception',
                        '銀杏': 'いちょう: exception, &emsp;ぎんなん: exception',
                        '南瓜': 'かぼちゃ: exception',
                        '老舗': 'しにせ: exception, ろうほ, 老: ろう: on, 舗: ほ: on',
                        '山葵': 'わさび: exception',
                        '凛々しい': 'りりしい: exception',
                        '怠い': 'だるい: exception',
                        '疎か': 'おろそか: exception',
                        '烏龍茶': 'うーろんちゃ, 烏龍: うーろん: exception, 茶: ち: on',
                        '烏賊': 'いか: exception',
                        '金縛り': 'かなしばり, 金: かな: exception, 縛: しば: kun',
                        '悪戯': 'いたずら: exception',
                        '硫黄': 'いおう: exception',
                        '出来る': 'できる, 出: で: kun, 来: き: kun',
                        '私': '私: わたし: kun, 私: わたくし: kun',
                        '少女': 'しょうじょ, 少: しょう: on, 女: じょ: on, &emsp;おとめ: exception',
                        '申し申し': 'もうしもうし, 申: もう: on, &emsp;もしもし: exception',
                        '身体': 'しんたい, 身: しん: on, 体: たい: on, からだ, 身体: kun',
                        '他所': 'たしょ, 他: た: on, 所: しょ: on, &emsp;よそ: exception',
                        '出来上がる': 'できあがる, 出: で: kun, 来: き: kun, 上: あ: kun',
                        '私自身': 'わたしじしん, 私: わたし: kun, 自: じ: on, 身: しん: on, &emsp;わたくしじしん, 私: わたくし: kun, 自: じ: on, 身: しん: on',
                        '神道': 'しんとう, 神: しん: on, 道: とう: on',
                        '受付': 'うけつけ, 受: うけ: kun, 付: つけ: kun',
                        '息子': 'むすこ: exception',
                        '流行': 'りゅうこう, 流: りゅう: on, 行: こう: on, &emsp;はやり: exception',
                        '手伝う': 'てつだう, 手: て: kun, 伝: つだ: kun',
                        '詩歌': 'しいか, 詩: し: on, 歌: いか: exception, &emsp;しか, 詩: し: on, 歌: か: on',
                        '悪口': 'わるくち, 悪: わる: kun, 口: くち: kun, &emsp;わるぐち, 悪: わる: kun, 口: ぐち: kun, &emsp;あっこう, 悪: あく: on, 口: こう: on',
                        '待合': 'まちあい, 待: まち: kun, 合: あい: kun',
                        '合図': 'あいず, 合: あい: kun, 図: ず: on',
                        '不器用': 'ぶきよう, 不: ぶ: on, 器: き: on, 用: よう: on, &emsp;ぶきっちょ, 不: ぶ: on, 器: きっ: on, 用: ちょ: exception',
                        '世紀': 'せいき, 世: せい: on, 紀: き: on',
                        '時計': 'とけい, 時: と: exception, 計: けい: on',
                        '待合室': 'まちあいしつ, 待: まち: kun, 合: あい: kun, 室:しつ: on',
                        '外面': 'がいめん, 外: がい: on, 面: めん: on',
                        '悪因悪果': 'あくいんあっか, 悪: あく: on, 因: いん: on, 悪: あっ: on, 果: か: on',
                        '建前': 'たてまえ, 建: たて: kun, 前: まえ: kun',
                        '鼻血': 'はなぢ, 鼻: はな: kun, 血: ぢ: exception, &emsp;はなじ, 鼻: はな: kun, 血: じ: exception',
                        '建物': 'たてもの, 建: たて: kun, 物: もの: kun',
                        '可愛い': 'かわいい, 可: か: on, 愛: わい: exception',
                        '若布': 'わかめ, 若: わか: kun, 布: め: exception',
                        '昆布': 'こんぶ, 昆: こん: on, 布: ぶ: exception, &emsp;こぶ, 昆: こ: exception, 布: ぶ: exception',
                        '立入禁止': 'たちいりきんし, 立: たち: kun, 入: いり: kun, 禁: きん: on, 止: し: on',
                        '口笛': 'くちぶえ, 口: くち: kun, 笛: ぶえ: exception',
                        '布地': 'ぬのじ, 布: ぬの: kun, 地: じ: on, &emsp;きれじ, 布: きれ: kun, 地: じ: on',
                        '坊主': 'ぼうず, 坊: ぼう: on, 主: ず: exception',
                        '反応': 'はんのう, 反: はん: on, 応: のう: on, &emsp;はんおう, 反: はん: on, 応: おう: exception',
                        '有り難う': 'ありがとう: exception',
                        '崎': 'さき, 崎: さき: kun, &emsp;みさき, 崎: みさき: kun',
                        '割り算': 'わりざん, 割: わ: kun, 算: ざん: exception',
                        '腕時計': 'うでどけい, 腕: うで: kun, 時: ど: exception, 計: けい: on',
                        '再開': 'さいかい, 再: さい: on, 開: かい: on',
                        '再建': 'さいけん, 再: さい: on, 建: けん: on',
                        '再度': 'さいど, 再: さい: on, 度: ど: on',
                        '河童': 'かっぱ, 河: かっ: on, 童: ぱ: exception',
                        '中途半端': 'ちゅうとはんぱ, 中: ちゅう: on, 途: と: on, 半: はん: on, 端: ぱ: exception',
                        '迷子': 'まいご, 迷: まい: on, 子: ご: kun',
                        '刺身': 'さしみ, 刺: さし: kun, 身: み: kun',
                        '博打': 'ばくち, 博: ばく: on, 打: ち: exception',
                        '逆効果': 'ぎゃくこうか, 逆: ぎゃく: on,  効: こう: on,  果: か: on, &emsp;ぎゃっこうか, 逆: ぎゃっ: on,  効: こう: on,  果: か: on',
                        '一人娘': 'ひとりむすめ, 一: ひと: kun, 人: り: kun, 娘: むすめ: kun',
                        '締切': 'しめきり, 締: しめ: kun, 切: きり: kun',
                        '織物': 'おりもの, 織: おり: kun, 物: もの: kun',
                        '浮世絵': 'うきよえ, 浮: うき: exception, 世: よ: kun, 絵: え: on',
                        '浮気': 'うわき, 浮: うわ: exception, 気: き: kun',
                        '強盗': 'ごうとう, 強: ごう: on, 盗: とう: on',
                        '成程': 'なるほど, 成: なる: kun, 程: ほど: kun',
                        '白旗': 'しらはた, 白: しら: kun,  旗: はた: kun, &emsp;はっき, 白: はっ: on,  旗: き: on, &emsp;しろはた, 白: しろ: kun,  旗: はた: kun',
                        '押入れ': 'おしいれ, 押: おし: kun, 入: い: kun',
                        '眼': 'おしいれ, 眼: め: kun, &emsp;まなこ, 眼: まなこ: kun',
                        '暖かい': 'あたたかい, 暖: あたた: kun, &emsp;あったかい, 暖: あった: kun',
                        '否': 'いな, 否: いな: kun, &emsp;いいえ, 否: いいえ: exception, &emsp;いえ, 否: いえ: exception, &emsp;いや, 否: いや: kun',
                        '天皇': 'てんのう, 天: てん: on, 皇: のう: exception',
                        '貴い': 'とうとい, 貴: とうと: kun, &emsp;たっとい, 貴: たっと: kun',
                        '磁石': 'じしゃく, 磁: じ: on, 石: しゃく: on',
                        '眼鏡': 'めがね, 眼: め: kun, 鏡: がね: exception, &emsp;がんきょう, 眼: がん: on, 鏡: きょう: on',
                        '口紅': 'くちべに, 口: くち: kun, 紅: べに: kun',
                        '奈良': 'なら, 奈: な: on, 良: ら: exception',
                        '神奈川県': 'かながわけん, 神: か: exception, 奈: な: on, 川: がわ: kun, 県: け: on',
                        '一人暮らし': 'ひとりぐらし, 一: ひと: kun, 人: り: kun, 暮: ぐ: kun',
                        '船酔い': 'ふなよい, 船: ふな: kun, 酔: よい: kun',
                        '酔っ払い': 'よっぱらい, 酔: よっ: kun, 払: ぱら: kun',
                        '二日酔い': 'ふつかよい, 二日: ふつか: exception, 酔: よい: kun',
                        '奈良県': 'ならけん, 奈: な: on, 良: ら: exception, 県: けん: on',
                        '膝頭': 'ひざがしら, 膝: ひざ: kun, 頭: がしら: kun',
                        '群馬県': 'ぐんまけん, 群: ぐん: on, 馬: ま: kun, 県: けん: on',
                        '免れる': 'まぬかれる, 免: まぬか: kun, &emsp;まぬがれる, 免: まぬが: kun',
                        '渋谷': 'しぶや, 渋: しぶ: kun, 谷: や: exception',
                        '故郷': 'こきょう, 故: こ: on, 郷: きょう: on, &emsp;ふるさと, 故: ふる: kun, 郷: さと: kun',
                        '掛軸': 'かけじく, 掛: か: kun, 軸: じく: exception',
                        '芝草': 'しばくさ, 芝: しば: kun, 草: くさ: kun',
                        '口笛を吹く': 'くちぶえをふく, 口: くち: kun, 笛: え: kun, 吹: ふ: kun',
                        '満潮': 'まんちょう, 満: まん: on, 潮: ちょう: on, &emsp;みちしお, 満: みち: exception, 潮: しお: kun',
                        '沼田': 'ぬまた, 沼: ぬま: kun, 田: た: kun, &emsp;ぬた, 沼: ぬ: exception, 田: た: kun',
                        '荒波': 'あらなみ, 荒: あら: kun, 波: なみ: kun',
                        '狩人': 'かりゅうど, 狩: か: kun, 人: りゅうど: exception',
                        '口癖': 'くちぐせ, 口: くち: kun, 癖: ぐせ: kun',
                        '瞬く': 'またたく, 瞬: またた: kun, &emsp;まばたく, 瞬: まばた: exception',
                        '木綿': 'もめん, 木: も: exception, 綿: めん: on',
                        '伊達': 'だて: exception',
                        '巻尺': 'まきじゃく, 巻: まき: kun, 尺: じゃく: on',
                        '可哀想': 'かわいそう, 可: か: on, 哀: わい: exception, 想: そう: on',
                        '挿絵': 'さしえ: exception',
                        '割り箸': 'わりばし, 割: わ: kun, 箸: ばし: kun',
                        '蚊帳': 'かや, 蚊: か: kun, 帳: や: exception',
                        '唯一': 'ゆいつ, 唯: ゆ: exception, 一: いつ: on, &emsp;ゆいいつ, 唯: ゆい: on, 一: いつ: on',
                        '割り勘': 'わりかん, 割: わり: kun, 勘: かん: on',
                        '風邪': 'かぜ: exception',
                        '伯母': 'おば: exception',
                        '伯父': 'おじ: exception',
                        '空き瓶': 'あきびん, 空: あ: kun, 瓶: びん: on, &emsp;からびん, 空: から: kun, 瓶: びん: on',
                        '平壌': 'へいじょう, 平: へい: on, 壌: じょう: on, &emsp;ぴょんやん, 平: ぴょん: on, 壌: やん: exception',
                        '玄人': 'くろうと: exception',
                        '西瓜': 'すいか, 西: すい: exception, 瓜: か: on',
                        '経緯': 'けいい, 経: けい: on, 緯: い: on, &emsp;いきさつ: exception',
                        '胡瓜': 'きゅうり, 胡: きゅ: exception, 瓜: うり: kun',
                        '冠': '冠: かん: on, &emsp;冠: かむり: exception, &emsp;平: かんむり: kun',
                        '阿呆': 'あほう, 阿: あ: on, 呆: ほう: on, &emsp;あほ, 阿: あ: on, 呆: ほ: exception',
                        '疾風': 'しっぷう, 疾: しっ: on, 風: ぷう: on, &emsp;はやて, 疾: はや: kun, 風: て: exception',
                        '疾病': 'しっぺい, 疾: しっ: on, 病: ぺい: on',
                        '茨城県': 'いばらきけん, 茨: いばら: kun, 城: き: exception, 県: けん: on',
                        '新陳代謝': 'しんちんたいしゃ, 新: しん: on, 陳: ちん: on, 代: たい: on, 謝: しゃ: on',
                        '弥生': 'やよい: 弥: や: kun, 生: よい: exception',
                        '披露宴': 'ひろうえん, 披: ひ: on, 露: ろう: on, 宴: えん: on',
                        '瓜実顔': 'うりざねがお, 瓜: うり: kun, 実: ざね: exception, 顔: がお: kun',
                        '賓客': 'ひんきゃく, 賓: ひん: on, 客: きゃく: on, &emsp;ひんかく, 賓: ひん: on, 客: かく: on',
                        '柴犬': 'しばいぬ, 柴: しば: kun, 犬: いぬ: kun, &emsp;しばけん, 柴: しば: kun, 犬: けん: on',
                        '腸': '腸: ちょう: on, &emsp;腸: わた: kun, &emsp;腸: はらわた: kun',
                        '縫目': 'ぬいめ, 縫: ぬい: exception, 目: め: kun',
                        '叔父': 'おじ: exception',
                        '叔母': 'おば: exception',
                        '漬物': 'つけもの, 漬: つけ: kun, 物: もの: kun',
                        '湧水': 'ゆうすい, 湧: しば: on, 水: すい: on, &emsp;わきみず, 湧: ;わき: exception, 水: みず: kun',
                       };

    // Readings that may morph into something with a little っ
    const littleTsu = {'いち': 'いっ', 'いつ': 'いっ', 'うつ': 'うっ', 'えつ': 'えっ', 'あき': 'あっ', 'あつ': 'あっ',
                       'か': 'かっ',  'かつ': 'かっ', 'かく': 'かっ', 'き': 'きっ', 'きつ': 'きっ', 'けつ': 'けっ', 'こく': 'こっ', 'こつ': 'こっ',
                       'がく': 'がっ', 'げつ': 'げっ','きゃく': 'きゃっ',
                       'さ': 'さっ', 'さく': 'さっ', 'せつ': 'せっ', 'ざつ': 'ざっ', 'ぜつ': 'ぜっ',
                       'さつ': 'さっ', 'しゃく': 'しゃっ', 'しつ': 'しっ', 'しり': 'しっ', 'しゅつ': 'しゅっ', 'しょく': 'しょっ', 'そく': 'そっ', 'じつ': 'じっ',
                       'たく': 'たっ', 'てつ': 'てっ', 'ちつ': 'ちっ', 'とく': 'とっ', 'とつ': 'とっ', 'だつ': 'だっ', 'ちょく': 'ちょっ',
                       'にち': 'にっ', 'ねつ': 'ねっ',
                       'はち': 'はっ', 'はつ': 'はっ', 'ふつ': 'ふっ', 'ふく': 'ふっ', 'ばつ': 'ばっ', 'ひつ': 'ひっ', 'ほく': 'ほっ', 'ほつ': 'ほっ',
                       'ぶつ': 'ぶっ', 'べつ': 'べっ', 'ぼつ': 'ぼっ',
                       'まつ': 'まっ', 'み': 'みっ', 'みつ': 'みっ', 'む': 'むっ',
                       'や': 'やっ', 'やく': 'やっ', 'よ': 'よっ', 'よく': 'よっ',
                       'りつ': 'りっ', 'れつ': 'れっ',};

    const rendaku = 'がぎぐげござじずぜぞだぢちづでどばびぶべぼ';
    const vanilla = 'かきくけこさしすせそたちしつてとはひふへほ';
    const rendaku2 = 'ぱぴぷぺぽ';
    const vanilla2 = 'はひふへほ';

    // odd forms of rendaku and other exceptions
    const rendaku3 = {'ちゅう' : 'じゅう',
                      'もん' : 'も',
                     };

    function readingByType(item){
        // make sure readings are returned in the order WK provides them, but primary comes first
        const shortLabel = {'onyomi' : 'on', 'kunyomi' : 'kun', 'nanori': 'nan'};
        if (item.object === 'kanji'){
            let readings = "";
            let readingsPrimary = "";
            for (let k = 0; k < item.data.readings.length; k++){
                if(item.data.readings[k].primary){
                    if (readingsPrimary.length != 0){
                        readingsPrimary += ', ' + item.data.readings[k].reading;
                        readingsPrimary += ':'+ shortLabel[item.data.readings[k].type];
                    } else {
                        readingsPrimary = item.data.readings[k].reading;
                        readingsPrimary += ':'+ shortLabel[item.data.readings[k].type];
                    }
                } else {
                    if (readings.length != 0){
                        readings += ', ' + item.data.readings[k].reading;
                        readings += ':'+ shortLabel[item.data.readings[k].type];
                    } else {
                        readings = item.data.readings[k].reading;
                        readings += ':'+ shortLabel[item.data.readings[k].type];
                    };
                };
            };
            if (readings.length != 0){readingsPrimary = readingsPrimary + ', ' + readings}
            return readingsPrimary;
        } else if (item.object === 'vocabulary') {
            let characters = item.data.characters;
            let readings = [];
            let kanjiReadings, kanjiReading, readingLength, found;
            let firstTime = true;
            for (let readingData of item.data.readings){
                if (!readingData.accepted_answer) continue;

                if (characters in exceptions){
                    readings.push(exceptions[characters]);
                    break;
                };

                let reading = readingData.reading;
                if (firstTime){
                    readings.push(reading)
                    firstTime = false;
                } else {
                    readings.push('&emsp;'+reading);
                };
                let positionInReading = 0;
                for (let i=0, l=characters.length; i<l;  i++){
                    let character = characters.charAt(i);
                    if (character === '々') {
                        positionInReading += readingLength; // reuse readingLength from previous kanji
                        continue;
                    };
                    if (character === '〜') continue;
                    found = false;
                    if (character in kanjiIndex){
                        kanjiReadings = kanjiIndex[character].data.readings;
                        for (var k = 0; k < kanjiReadings.length; k++){
                            kanjiReading = kanjiReadings[k].reading;

                            // little tsu version of kanji reading - and other exceptions
                            // must come before direct reading because little tsu reading may start with the direct reading
                            if (kanjiReading in littleTsu && reading.startsWith(littleTsu[kanjiReading], positionInReading)){
                                readingLength = littleTsu[kanjiReading].length;
                                kanjiReading = littleTsu[kanjiReading];
                                found = true;
                                break;
                            };

                            // direct kanji reading
                            if (reading.startsWith(kanjiReading, positionInReading)) {
                                readingLength = kanjiReading.length;
                                found = true;
                                break;
                            };

                            // rendakued version of kanji reading
                            let c = vanilla.indexOf(kanjiReading.charAt(0));
                            if (c >= 0){
                                let rendakuedReading = rendaku.charAt(c) + kanjiReading.slice(1);
                                if (reading.startsWith(rendakuedReading, positionInReading)){
                                    readingLength = rendakuedReading.length;
                                    kanjiReading = rendakuedReading;
                                    found = true;
                                    break;
                                }
                            };
                            c = vanilla2.indexOf(kanjiReading.charAt(0));
                            if (c >= 0){
                                let rendakuedReading = rendaku2.charAt(c) + kanjiReading.slice(1);
                                if (reading.startsWith(rendakuedReading, positionInReading)){
                                    readingLength = rendakuedReading.length;
                                    kanjiReading = rendakuedReading;
                                    found = true;
                                    break;
                                }
                            };
                            if (kanjiReading in rendaku3 && reading.startsWith(rendaku3[kanjiReading], positionInReading)){
                                readingLength = rendaku3[kanjiReading].length;
                                kanjiReading = rendaku3[kanjiReading];
                                found = true;
                                break;
                            };


                        };
                        readings.push(character + ': ' + kanjiReading + ': ' + shortLabel[kanjiReadings[k].type]);
                        positionInReading += readingLength;
                    } else {
                        positionInReading++; // if we get here character is a kana
                    };
                };
            };
            return readings.join(', ');
        };
    };

    function readingsFull(item){
        // make sure readings are returned in the order WK provides them, but primary comes first
        var readings = "";
        var readingsPrimary = "";
        for (var k = 0; k < item.data.readings.length; k++){
            if(item.data.readings[k].primary){
                if (readingsPrimary.length != 0){
                    readingsPrimary += ', ' + item.data.readings[k].reading;
                } else {
                    readingsPrimary = item.data.readings[k].reading;
                }
            } else {
                if (readings.length != 0){
                    readings += ', ' + item.data.readings[k].reading;
                } else {
                    readings = item.data.readings[k].reading;
                }
            }
        }
        if (readings.length != 0){readingsPrimary = readingsPrimary + ', ' + readings}
        return readingsPrimary;
    }

    function readingsBrief(item){
        var readings = item.data.readings[0].reading;
        for (var k = 0; k < item.data.readings.length; k++){if (item.data.readings[k].primary){return item.data.readings[k].reading}};
        return readings;
    }

    // BEGIN Support of Lars Yencken visually similar kanji

    var visuallySimilarData;
    // function to be invoked in the startup sequence
    function get_visually_similar_data(){
        return load_file(visuallySimilarFilename, true, {responseType: "arraybuffer"})
             .then(function(data){lzmaDecompressAndProcessVisuallySimilar(data)})
    };

    function lzmaDecompressAndProcessVisuallySimilar(data){
        let inStream = new LZMA.iStream(data);
        let outStream = LZMA.decompressFile(inStream);
        let string = streamToString(outStream);
        visuallySimilarData = JSON.parse(string);
    };

    function deleteVisuallySimilarCache(){
        wkof.file_cache.delete(visuallySimilarFilename);
    }

    function makeListVisSimKan(visuallySimilarData){
        if (visuallySimilarData === undefined) return [];
        let acc = [];
        let threshold = quiz.settings.tablePresets[quiz.settings.active_ipreset].visSimTreshold;
        for (var data of visuallySimilarData){
            if (data.score >= threshold && kanjiIndex[data.kan] !== undefined) acc.push(nameItem(kanjiIndex[data.kan])); // test because some Lars Yencken kanji are not in WK
        }
        return acc.join(', ');
        //return acc;
    }

    function makeItemListVisSimKan(visuallySimilarData){
        if (visuallySimilarData === undefined) return [];
        let acc = [];
        let threshold = quiz.settings.tablePresets[quiz.settings.active_ipreset].visSimTreshold;
        for (var data of visuallySimilarData){
            if (data.score >= threshold && kanjiIndex[data.kan] !== undefined) acc.push(kanjiIndex[data.kan]); // test because some Lars Yencken kanji are not in WK
        }
        return acc;
    }

    function makeIdListVisSimKan(visuallySimilarData){
        if (visuallySimilarData === undefined) return [];
        let acc = [];
        let threshold = quiz.settings.tablePresets[quiz.settings.active_ipreset].visSimTreshold;
        for (var data of visuallySimilarData){
            if (data.score >= threshold && kanjiIndex[data.kan] !== undefined) acc.push(kanjiIndex[data.kan].id); // test because some Lars Yencken kanji are not in WK
        }
        return acc;
    }

    // END Support of Lars Yencken visually similar kanji

    // BEGIN Support of JLPT, Joyo and Frequency

    // JLPT Source: http://www.tanos.co.uk/jlpt/skills/kanji/
    // Joyo Source: https://en.wikipedia.org/wiki/List_of_j%C5%8Dy%C5%8D_kanji
    // Total frequency Source: https://kanjicards.org/kanji-list-by-freq.html
    // NHK frequency Source: https://gist.github.com/adrian17/836b97ee5740b20e63edbe35251d6bc1
    // Other frequency sources: https://github.com/scriptin/topokanji/tree/master/data/kanji-frequency

    // Data includes:
    // JLPT level (1,2,3,4,5)
    // Joyo grade (1,2,3,4,5,6,9)
    // Total frequency intervals (500, 1000, 1500, 2000, 2500)
    // NHK relative frequency (0 to 1)
    // Online news relative frequency (0 to 1)
    // Aozora Bunko relative frequency (0 to 1)
    // Twitter relative frequency (0 to 1)
    // Wikipedia relative frequency (0 to 1)

    var jlptJoyoFreqdata = {日:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.02542405039274466,aozora_rel_freq:0.007423776294196237,news_rel_freq:0.021873898222561028,twitter_rel_freq:0.023845901200870854,wikipedia_rel_freq:0.01824798162585284},一:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.0024348903983101226,aozora_rel_freq:0.01413981216459594,news_rel_freq:0.004194289238589051,twitter_rel_freq:0.008026662119564142,wikipedia_rel_freq:0.0054878889801648605},国:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.013629061839891727,aozora_rel_freq:0.001829588833389155,news_rel_freq:0.008718082010328192,twitter_rel_freq:0.0018161090169163008,wikipedia_rel_freq:0.006485906322328061},人:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.032210121554788196,aozora_rel_freq:0.01465223146083925,news_rel_freq:0.008839513753574387,twitter_rel_freq:0.011658280447612402,wikipedia_rel_freq:0.007351522826886731},年:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.01573508392466386,aozora_rel_freq:0.004487646166929225,news_rel_freq:0.009728107252237087,twitter_rel_freq:0.0034648001690370705,wikipedia_rel_freq:0.02685131991368414},大:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.01257288860218318,aozora_rel_freq:0.006628253058324812,news_rel_freq:0.010556033335678623,twitter_rel_freq:0.00970104066944757,wikipedia_rel_freq:0.00901908994424414},十:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.00038578782934264286,aozora_rel_freq:0.004104268964205165,news_rel_freq:0.00043794896067801746,twitter_rel_freq:0.00030774901833160653,wikipedia_rel_freq:0.0006557140743923237},二:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.00032254392289302926,aozora_rel_freq:0.005643100300108824,news_rel_freq:0.0007655142377507546,twitter_rel_freq:0.0014611831435497745,wikipedia_rel_freq:0.001375727512981109},本:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.013021920337975437,aozora_rel_freq:0.004689766140294844,news_rel_freq:0.006787385131676395,twitter_rel_freq:0.005668319122638434,wikipedia_rel_freq:0.008482758020400574},中:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.009069176184874588,aozora_rel_freq:0.005863072100050416,news_rel_freq:0.006902032978651854,twitter_rel_freq:0.005661422506118498,wikipedia_rel_freq:0.005690109441769902},長:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.003269709963445022,aozora_rel_freq:0.002096822324363765,news_rel_freq:0.0047437848365187605,twitter_rel_freq:0.0019901236453395963,wikipedia_rel_freq:0.003102946830543853},出:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.007298346804285407,aozora_rel_freq:0.008723929291537345,news_rel_freq:0.005347260866202764,twitter_rel_freq:0.005677014856511396,wikipedia_rel_freq:0.005304448363388463},三:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.0006577366270759812,aozora_rel_freq:0.0042263568097220235,news_rel_freq:0.0014178343205840664,twitter_rel_freq:0.001542843081184371,wikipedia_rel_freq:0.002050885494856871},時:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.003914797809231081,aozora_rel_freq:0.005938597564389247,news_rel_freq:0.006280821905860066,twitter_rel_freq:0.008664149368319902,wikipedia_rel_freq:0.003928191894549889},行:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.009303178638738158,aozora_rel_freq:0.005952234106561535,news_rel_freq:0.0042700750512135715,twitter_rel_freq:0.008892437370226167,wikipedia_rel_freq:0.004438848428531352},見:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.006248497957221821,aozora_rel_freq:0.009066591120482036,news_rel_freq:0.0038960885410882183,twitter_rel_freq:0.006434743115027767,wikipedia_rel_freq:0.0018876586393901983},月:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.010966493378362994,aozora_rel_freq:0.002995396637477344,news_rel_freq:0.0063108648750590446,twitter_rel_freq:0.003812129769135262,wikipedia_rel_freq:0.014023583373269607},後:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.0013154732541519624,aozora_rel_freq:0.0026331541325929557,news_rel_freq:0.0042854841870285315,twitter_rel_freq:0.0029041752116411687,wikipedia_rel_freq:0.003241257953235288},前:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.005204973500803197,aozora_rel_freq:0.003970603655533486,news_rel_freq:0.004547051844667383,twitter_rel_freq:0.005266316345201044,wikipedia_rel_freq:0.0027087600034140214},生:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.005394705220152039,aozora_rel_freq:0.0050928017200536,news_rel_freq:0.0032477418832134813,twitter_rel_freq:0.004954069533486871,wikipedia_rel_freq:0.004074833753348289},五:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.0021694145723663905,news_rel_freq:0.0007740425644911098,twitter_rel_freq:0.00030774901833160653,wikipedia_rel_freq:0.0005046901668277448},間:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.004224692950834187,aozora_rel_freq:0.005076076559355109,news_rel_freq:0.0034642450870538645,twitter_rel_freq:0.005723392103833859,wikipedia_rel_freq:0.003165185178784843},上:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.007064344350421837,aozora_rel_freq:0.005882555649621365,news_rel_freq:0.005843066770789783,twitter_rel_freq:0.003693687876727677,wikipedia_rel_freq:0.004183942688930378},東:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.006640610177209426,aozora_rel_freq:0.0009667764492487722,news_rel_freq:0.005350071337514927,twitter_rel_freq:0.005710398478506445,wikipedia_rel_freq:0.0038733767726073947},四:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.0019916927428303938,news_rel_freq:0.0003914308148215341,twitter_rel_freq:0.0004333873801512978,wikipedia_rel_freq:0.0005834612534474746},今:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.005084810078548932,aozora_rel_freq:0.0038449415596466825,news_rel_freq:0.002532040826650711,twitter_rel_freq:0.01345389951689701,wikipedia_rel_freq:0.0005274505638078667},金:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.0034531172921489013,aozora_rel_freq:0.0015235047949151471,news_rel_freq:0.0023305591074098174,twitter_rel_freq:0.002214713461575751,wikipedia_rel_freq:0.0016226632261321355},九:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.0003731390480527201,aozora_rel_freq:0.0009827828748185242,news_rel_freq:0.00048407945531903014,twitter_rel_freq:0.0002672688778885079,wikipedia_rel_freq:0.0003986657449205105},入:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.004724319811786134,aozora_rel_freq:0.0032856296525715974,news_rel_freq:0.0030318201561963043,twitter_rel_freq:0.0034905875177637853,wikipedia_rel_freq:0.0021275547785634453},学:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.004572534436307062,aozora_rel_freq:0.0027548534726348204,news_rel_freq:0.0024345465459598313,twitter_rel_freq:0.0035926374520660162,wikipedia_rel_freq:0.0077316113871745895},高:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.004167773435029535,aozora_rel_freq:0.0014975526291855492,news_rel_freq:0.004154554989003304,twitter_rel_freq:0.004182747943858743,wikipedia_rel_freq:0.0035287295293621123},円:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.0024601879608899683,aozora_rel_freq:0.0004458100325555933,news_rel_freq:0.0038695344328284757,twitter_rel_freq:0.0013506373773026954,wikipedia_rel_freq:0.0005076395737052719},子:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.005552814986276073,aozora_rel_freq:0.00658378860671175,news_rel_freq:0.004162889490135924,twitter_rel_freq:0.004091492713674671,wikipedia_rel_freq:0.0039934637727686295},外:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.003965392934390771,aozora_rel_freq:0.0018431670997401948,news_rel_freq:0.0019503701778369334,twitter_rel_freq:0.0014706784851351927,wikipedia_rel_freq:0.0021495593422339847},八:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.00018340732870387937,aozora_rel_freq:0.00145167013258876,news_rel_freq:0.00041304237008402535,twitter_rel_freq:0.0005669218681314947,wikipedia_rel_freq:0.0005813365078706216},六:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.0013448894027866642,news_rel_freq:0.00018413432734858004,twitter_rel_freq:0.0002422811368742495,wikipedia_rel_freq:0.000275072340990876},下:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.0018403976776837552,aozora_rel_freq:0.0037847620615701146,news_rel_freq:0.0023963629012359678,twitter_rel_freq:0.0027460527865029415,wikipedia_rel_freq:0.0023845559481154364},来:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.006071415019162904,aozora_rel_freq:0.007101627554331228,news_rel_freq:0.0016146642252393116,twitter_rel_freq:0.004616235274974098,wikipedia_rel_freq:0.0011524928460217923},気:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.005723573533690029,aozora_rel_freq:0.004520358327923718,news_rel_freq:0.002863773354289758,twitter_rel_freq:0.007408865210727617,wikipedia_rel_freq:0.001248701631643877},小:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.0020807245221922867,aozora_rel_freq:0.0034745598650611706,news_rel_freq:0.0018583030141626432,twitter_rel_freq:0.0018320012202013693,wikipedia_rel_freq:0.0027642952700781247},七:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.0001201634222542658,aozora_rel_freq:0.0012473356780156757,news_rel_freq:0.0001931472181082737,twitter_rel_freq:0.00014043110450013223,wikipedia_rel_freq:0.00025542194953416216},山:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.0035796051050481286,aozora_rel_freq:0.002709961664999266,news_rel_freq:0.0028429371014582084,twitter_rel_freq:0.0029534510369212865,wikipedia_rel_freq:0.0038198566365713685},話:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.007880190743621852,aozora_rel_freq:0.002238646248010318,news_rel_freq:0.001545662308885528,twitter_rel_freq:0.002613118004307087,wikipedia_rel_freq:0.001804541192592263},女:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.0024791611328248524,aozora_rel_freq:0.004720730026651864,news_rel_freq:0.0023892882665536275,twitter_rel_freq:0.002259791346365473,wikipedia_rel_freq:0.002003673316745167},北:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.0023084025854108957,aozora_rel_freq:0.0005002202243285003,news_rel_freq:0.00290408908069871,twitter_rel_freq:0.001751340792207343,wikipedia_rel_freq:0.002145903811151553},午:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.001271202519637233,aozora_rel_freq:0.0002771403805869564,news_rel_freq:0.002018209140544305,twitter_rel_freq:0.00027786368007855347,wikipedia_rel_freq:0.00008850769817436672},百:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.0010510821373224662,news_rel_freq:0.00016901592994522294,twitter_rel_freq:0.00015942178767096863,wikipedia_rel_freq:0.0003638540765371824},書:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.0018340732870387939,aozora_rel_freq:0.0027723167937357997,news_rel_freq:0.0010758290357350457,twitter_rel_freq:0.0010536830630892484,wikipedia_rel_freq:0.0020383141897431932},先:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.0008537927370697833,aozora_rel_freq:0.002206167190300821,news_rel_freq:0.0013330356171998518,twitter_rel_freq:0.002226407724370424,wikipedia_rel_freq:0.0006509330781962977},名:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.0018403976776837552,aozora_rel_freq:0.0019706357460857198,news_rel_freq:0.00155515976366456,twitter_rel_freq:0.002526960273289924,wikipedia_rel_freq:0.004851982072097848},川:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.0014356366764062282,aozora_rel_freq:0.0012703352021353194,news_rel_freq:0.002445885344012349,twitter_rel_freq:0.0030290139657484037,wikipedia_rel_freq:0.003101354864601748},千:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.0004047610012775269,aozora_rel_freq:0.0007660162450456324,news_rel_freq:0.0013970949805563841,twitter_rel_freq:0.001614707824341378,wikipedia_rel_freq:0.0007206418126556049},水:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.0025740269924992725,aozora_rel_freq:0.0021148684036772355,news_rel_freq:0.0015999334790514253,twitter_rel_freq:0.001688871439671697,wikipedia_rel_freq:0.0017989699490911087},半:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.0009170366435193969,aozora_rel_freq:0.0009230501580381996,news_rel_freq:0.0013809105423104827,twitter_rel_freq:0.0010689755605899746,wikipedia_rel_freq:0.0005381176278346708},男:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.002510783086049659,aozora_rel_freq:0.0018628837525961393,news_rel_freq:0.0022034095087354296,twitter_rel_freq:0.0010363915463073815,wikipedia_rel_freq:0.000991478683009479},西:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.0007968732212651311,aozora_rel_freq:0.0007236108724500395,news_rel_freq:0.001586656424921554,twitter_rel_freq:0.0014542865270298392,wikipedia_rel_freq:0.001831384109118072},電:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.004294261247928762,aozora_rel_freq:0.000584545337675944,news_rel_freq:0.0014450668184708827,twitter_rel_freq:0.0019661354139659084,wikipedia_rel_freq:0.0014994738680020585},校:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.002346348929280664,aozora_rel_freq:0.0010606005214598186,news_rel_freq:0.0009697095154999431,twitter_rel_freq:0.0021212593101824244,wikipedia_rel_freq:0.0030149030840131426},語:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.0013407708167318079,aozora_rel_freq:0.0011631076910369805,news_rel_freq:0.000762122289615386,twitter_rel_freq:0.0009676252830361424,wikipedia_rel_freq:0.0022376298552056755},土:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.0008917390809395515,aozora_rel_freq:0.0009748767884023967,news_rel_freq:0.0006268320154161135,twitter_rel_freq:0.0009452362670873669,wikipedia_rel_freq:0.0009550674011294799},木:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.0011194171441581604,aozora_rel_freq:0.00163176184552222,news_rel_freq:0.0011025769696025238,twitter_rel_freq:0.0012004110783249739,wikipedia_rel_freq:0.0016978527080302355},聞:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.001359743988666692,aozora_rel_freq:0.002108263810602338,news_rel_freq:0.0005815737360099099,twitter_rel_freq:0.0014193036896098775,wikipedia_rel_freq:0.0005833019293940213},食:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.002352673319925625,aozora_rel_freq:0.001256679234689281,news_rel_freq:0.0006334220860791153,twitter_rel_freq:0.003579743777702659,wikipedia_rel_freq:0.000498291712841061},車:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.00437647832631326,aozora_rel_freq:0.0010859310784294262,news_rel_freq:0.001588110116979569,twitter_rel_freq:0.0025411533101860227,wikipedia_rel_freq:0.002584975410620243},何:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.0007146561428806335,aozora_rel_freq:0.005768801246543127,news_rel_freq:0.00031932768874398486,twitter_rel_freq:0.003309276468964326,wikipedia_rel_freq:0.00032923487161042584},南:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.0011194171441581604,aozora_rel_freq:0.0004697031192677231,news_rel_freq:0.0012372857669785903,twitter_rel_freq:0.0009667257243596291,wikipedia_rel_freq:0.0014327349338991205},万:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.004490317357922564,aozora_rel_freq:0.0006199576117216453,news_rel_freq:0.002252931951511811,twitter_rel_freq:0.0007250442932697219,wikipedia_rel_freq:0.0006176980806459432},毎:{jlpt_level:5,joyo_grade:2,frequency:500,nhk_rel_freq:0.0009360098154542809,aozora_rel_freq:0.00042187809529596403,news_rel_freq:0.00019469782297015648,twitter_rel_freq:0.0009149511249780857,wikipedia_rel_freq:0.0003256927792540525},白:{jlpt_level:5,joyo_grade:1,frequency:500,nhk_rel_freq:0.0004933024703069859,aozora_rel_freq:0.0018893798259907288,news_rel_freq:0.0006297393995321437,twitter_rel_freq:0.0015661316558096597,wikipedia_rel_freq:0.0007186241328426725},天:{jlpt_level:5,joyo_grade:1,frequency:1000,nhk_rel_freq:0.0008917390809395515,aozora_rel_freq:0.001408817978696924,news_rel_freq:0.0008667881177924736,twitter_rel_freq:0.001602413855762363,wikipedia_rel_freq:0.0012633161084190396},母:{jlpt_level:5,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0004616805170821791,aozora_rel_freq:0.0015024477981704734,news_rel_freq:0.0002841483409400193,twitter_rel_freq:0.0004434824275210582,wikipedia_rel_freq:0.0004531800630500852},火:{jlpt_level:5,joyo_grade:1,frequency:1000,nhk_rel_freq:0.0028712733528124565,aozora_rel_freq:0.0009660965646675327,news_rel_freq:0.000930847481149006,twitter_rel_freq:0.0007710217367359574,wikipedia_rel_freq:0.0005789657659552368},右:{jlpt_level:5,joyo_grade:1,frequency:1000,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.0007543222302483137,news_rel_freq:0.0005383506254849275,twitter_rel_freq:0.0002771640233301542,wikipedia_rel_freq:0.00036383240846591275},読:{jlpt_level:5,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.000777535432379204,news_rel_freq:0.00016707767386786948,twitter_rel_freq:0.0006975577781540376,wikipedia_rel_freq:0.00038237135532573656},友:{jlpt_level:5,joyo_grade:2,frequency:1000,nhk_rel_freq:0.00022135367257364753,aozora_rel_freq:0.0006622658579484898,news_rel_freq:0.0002687392051250592,twitter_rel_freq:0.0010441877215038302,wikipedia_rel_freq:0.00037152329917420956},左:{jlpt_level:5,joyo_grade:1,frequency:1000,nhk_rel_freq:0.00017708293805891801,aozora_rel_freq:0.0007564007345395315,news_rel_freq:0.0005075323538550072,twitter_rel_freq:0.00026836833849313527,wikipedia_rel_freq:0.0003381825104523621},休:{jlpt_level:5,joyo_grade:1,frequency:1000,nhk_rel_freq:0.0005375732048217154,aozora_rel_freq:0.0002713516490095461,news_rel_freq:0.0002849236433709607,twitter_rel_freq:0.0018711819981117265,wikipedia_rel_freq:0.00022561050724441181},父:{jlpt_level:5,joyo_grade:2,frequency:1000,nhk_rel_freq:0.00023400245386357023,aozora_rel_freq:0.0013885768434497374,news_rel_freq:0.0002270666994619595,twitter_rel_freq:0.000312146860750116,wikipedia_rel_freq:0.00044893057189637927},雨:{jlpt_level:5,joyo_grade:1,frequency:1000,nhk_rel_freq:0.0006767097990108653,aozora_rel_freq:0.0005891491275546226,news_rel_freq:0.0005487202954987685,twitter_rel_freq:0.002137151513467493,wikipedia_rel_freq:0.00012972419350651673},会:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.009189339607128854,aozora_rel_freq:0.001823333895241752,news_rel_freq:0.008035137481472695,twitter_rel_freq:0.00469939447706955,wikipedia_rel_freq:0.005308852080225911},同:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0016316927864000303,aozora_rel_freq:0.0023119378058679323,news_rel_freq:0.005286690363785468,twitter_rel_freq:0.0020229075615503032,wikipedia_rel_freq:0.002698503358148913},事:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.006109361363032671,aozora_rel_freq:0.005848736248023139,news_rel_freq:0.00447049072961192,twitter_rel_freq:0.005049222851269167,wikipedia_rel_freq:0.003754681627377128},自:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.003503712417308592,aozora_rel_freq:0.0055502280663115135,news_rel_freq:0.0031642030462795466,twitter_rel_freq:0.0035632518686332486,wikipedia_rel_freq:0.002599229177738387},社:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.006254822347866783,aozora_rel_freq:0.0011566002243308313,news_rel_freq:0.0026345745731427097,twitter_rel_freq:0.001076072079038024,wikipedia_rel_freq:0.003637940432338412},発:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.003965392934390771,aozora_rel_freq:0.0015047594057466876,news_rel_freq:0.005579270118661975,twitter_rel_freq:0.0016313996353389028,wikipedia_rel_freq:0.003157099164423982},者:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.001094119581578315,aozora_rel_freq:0.004152463068378168,news_rel_freq:0.005392131494393497,twitter_rel_freq:0.001179921130693282,wikipedia_rel_freq:0.005073836355458046},地:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.004642102733401637,aozora_rel_freq:0.0023752059224707023,news_rel_freq:0.005193363333660899,twitter_rel_freq:0.0020477953516005046,wikipedia_rel_freq:0.004418823306900917},業:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0012522293477023488,aozora_rel_freq:0.0007241159295675317,news_rel_freq:0.003024454783102361,twitter_rel_freq:0.0014248009926330144,wikipedia_rel_freq:0.0029759477156476016},方:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0024791611328248524,aozora_rel_freq:0.00513217674994424,news_rel_freq:0.0029117451922042567,twitter_rel_freq:0.003618224898864617,wikipedia_rel_freq:0.0023470587134870997},新:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.00479388810888071,aozora_rel_freq:0.0018067252861857592,news_rel_freq:0.0031612956621635165,twitter_rel_freq:0.0035450607931748683,wikipedia_rel_freq:0.003465523765468554},場:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.006153632097547402,aozora_rel_freq:0.0019402546179411906,news_rel_freq:0.00431804688912807,twitter_rel_freq:0.002220610568455116,wikipedia_rel_freq:0.004198140373981708},員:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0014166635044713441,aozora_rel_freq:0.00036455411246060214,news_rel_freq:0.0027234436142893666,twitter_rel_freq:0.0007924112430441625,wikipedia_rel_freq:0.0015811255335082236},立:{jlpt_level:4,joyo_grade:1,frequency:500,nhk_rel_freq:0.0016316927864000303,aozora_rel_freq:0.003539304302468917,news_rel_freq:0.0022960581492329256,twitter_rel_freq:0.0013596329640678283,wikipedia_rel_freq:0.0030650289804144},開:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0013091488635070011,aozora_rel_freq:0.0008707378958302601,news_rel_freq:0.0036357807498996466,twitter_rel_freq:0.00118301961057905,wikipedia_rel_freq:0.002517943320258951},手:{jlpt_level:4,joyo_grade:1,frequency:500,nhk_rel_freq:0.0035353343705333993,aozora_rel_freq:0.004787708370540826,news_rel_freq:0.004214931665812865,twitter_rel_freq:0.0030339115629871983,wikipedia_rel_freq:0.0034648303871879253},力:{jlpt_level:4,joyo_grade:1,frequency:500,nhk_rel_freq:0.0017581805992992576,aozora_rel_freq:0.002176155142357536,news_rel_freq:0.0021732696267325827,twitter_rel_freq:0.001326049440144665,wikipedia_rel_freq:0.0016805730584889065},問:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0013281220354418853,aozora_rel_freq:0.0011967911157189587,news_rel_freq:0.0015946032748387032,twitter_rel_freq:0.0006267924956016578,wikipedia_rel_freq:0.0007119529160764767},代:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0010561732377085467,aozora_rel_freq:0.002139616202434352,news_rel_freq:0.002549872782562363,twitter_rel_freq:0.001935450468000399,wikipedia_rel_freq:0.0036809247873676797},明:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0013028244728620398,aozora_rel_freq:0.0021487072305492114,news_rel_freq:0.003179999833309977,twitter_rel_freq:0.004378651833410529,wikipedia_rel_freq:0.0021466634682384177},動:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0038262563402016217,aozora_rel_freq:0.001732190510808164,news_rel_freq:0.0022196908597851986,twitter_rel_freq:0.0019289536553366918,wikipedia_rel_freq:0.0027575768933921067},京:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.005046863734679163,aozora_rel_freq:0.0007866264604940631,news_rel_freq:0.0032533628258378062,twitter_rel_freq:0.005254222278550143,wikipedia_rel_freq:0.002377372345193335},目:{jlpt_level:4,joyo_grade:1,frequency:500,nhk_rel_freq:0.0013976903325364602,aozora_rel_freq:0.0025840081900062174,news_rel_freq:0.0030658365503538577,twitter_rel_freq:0.003576645297816891,wikipedia_rel_freq:0.002758452538389886},通:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0020174806157426733,aozora_rel_freq:0.0021189088606171727,news_rel_freq:0.0027027042742616843,twitter_rel_freq:0.0020950721575994815,wikipedia_rel_freq:0.002388106962618803},言:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.008721334699401713,aozora_rel_freq:0.004786309750830848,news_rel_freq:0.0012191630726553352,twitter_rel_freq:0.005413344213328941,wikipedia_rel_freq:0.0014365574365895716},理:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0016506659583349144,aozora_rel_freq:0.0019806786126143144,news_rel_freq:0.0016694199594245473,twitter_rel_freq:0.0020088144756182616,wikipedia_rel_freq:0.0019327792113281676},体:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.002194563553801591,aozora_rel_freq:0.0016405226439833343,news_rel_freq:0.002364575501567371,twitter_rel_freq:0.002345849126418579,wikipedia_rel_freq:0.0022732406930411255},田:{jlpt_level:4,joyo_grade:1,frequency:500,nhk_rel_freq:0.00218823916315663,aozora_rel_freq:0.0019749287315844032,news_rel_freq:0.0034451532646919327,twitter_rel_freq:0.004103386878397459,wikipedia_rel_freq:0.00406328339676914},主:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0003731390480527201,aozora_rel_freq:0.0019735106866006756,news_rel_freq:0.0018329118595493128,twitter_rel_freq:0.0005998057353062587,wikipedia_rel_freq:0.0025152819712700673},題:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0010688220189984696,aozora_rel_freq:0.0008170658644598416,news_rel_freq:0.0011077133482075105,twitter_rel_freq:0.0008594783399264321,wikipedia_rel_freq:0.0008952061677660131},意:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0010182268938387787,aozora_rel_freq:0.002383345112171826,news_rel_freq:0.0018590783165935848,twitter_rel_freq:0.0018745803308896655,wikipedia_rel_freq:0.0011273323915004503},不:{jlpt_level:4,joyo_grade:4,frequency:500,nhk_rel_freq:0.0008790902996496288,aozora_rel_freq:0.0022771471405822214,news_rel_freq:0.0015743484988303593,twitter_rel_freq:0.0011034586431896511,wikipedia_rel_freq:0.0011262872257097967},作:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.004218368560189226,aozora_rel_freq:0.0032549182947733232,news_rel_freq:0.0013536780444236664,twitter_rel_freq:0.001908763560597171,wikipedia_rel_freq:0.005025753630718273},用:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0012522293477023488,aozora_rel_freq:0.0014729213820709307,news_rel_freq:0.0018020935879193925,twitter_rel_freq:0.0010033077772045034,wikipedia_rel_freq:0.004459533789039299},度:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0018151001151039097,aozora_rel_freq:0.002317629411076594,news_rel_freq:0.0037219362325380087,twitter_rel_freq:0.0020670858876635123,wikipedia_rel_freq:0.002091645686099931},強:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0013028244728620398,aozora_rel_freq:0.000849894577096833,news_rel_freq:0.002030129415420029,twitter_rel_freq:0.0018618865584544223,wikipedia_rel_freq:0.0006440273364234187},公:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0009866049406139718,aozora_rel_freq:0.0007625196957706866,news_rel_freq:0.0019190673421876747,twitter_rel_freq:0.0008971598533759337,wikipedia_rel_freq:0.0023650521347878995},持:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0017771537712341415,aozora_rel_freq:0.0025303750091832983,news_rel_freq:0.001117695367005881,twitter_rel_freq:0.0018157092130600728,wikipedia_rel_freq:0.001012867618537475},野:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0014229878951163056,aozora_rel_freq:0.0013274455069594345,news_rel_freq:0.0025734225939022075,twitter_rel_freq:0.002340651676287613,wikipedia_rel_freq:0.0026610226932221354},以:{jlpt_level:4,joyo_grade:4,frequency:500,nhk_rel_freq:0.00442707345147295,aozora_rel_freq:0.0014913753921331448,news_rel_freq:0.002608698854510041,twitter_rel_freq:0.0010444875743960012,wikipedia_rel_freq:0.0018288591415189443},思:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0019162903654232914,aozora_rel_freq:0.006320401319939582,news_rel_freq:0.0008724090604167987,twitter_rel_freq:0.005287505949581136,wikipedia_rel_freq:0.0007207361324952492},家:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.004180422216319458,aozora_rel_freq:0.00396193998344112,news_rel_freq:0.0014286885546172458,twitter_rel_freq:0.0023825311302275104,wikipedia_rel_freq:0.0024078096123650496},世:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.003604902667627974,aozora_rel_freq:0.001996393659077821,news_rel_freq:0.001736677445308713,twitter_rel_freq:0.0010463866427130849,wikipedia_rel_freq:0.002215191930109743},多:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0047496173743659794,aozora_rel_freq:0.0016027987623614187,news_rel_freq:0.0012135421300310102,twitter_rel_freq:0.001703864084280252,wikipedia_rel_freq:0.0015584671039223117},正:{jlpt_level:4,joyo_grade:1,frequency:500,nhk_rel_freq:0.0009866049406139718,aozora_rel_freq:0.001873684204800972,news_rel_freq:0.001375483425293893,twitter_rel_freq:0.0007502319362120944,wikipedia_rel_freq:0.0016048214813302233},安:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.002510783086049659,aozora_rel_freq:0.0009409796857091718,news_rel_freq:0.0031389088044700836,twitter_rel_freq:0.001394315948595619,wikipedia_rel_freq:0.000903701326296142},院:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0011383903160930445,aozora_rel_freq:0.000400257765612549,news_rel_freq:0.0014026190103768417,twitter_rel_freq:0.0006626748916981329,wikipedia_rel_freq:0.0011242313081240357},心:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0013344464260868466,aozora_rel_freq:0.003931014947631599,news_rel_freq:0.0019211025110688958,twitter_rel_freq:0.0014508881942519,wikipedia_rel_freq:0.0008253725232487985},界:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.003105275806676027,aozora_rel_freq:0.0007444347659097168,news_rel_freq:0.0014575685701698126,twitter_rel_freq:0.000657177588674996,wikipedia_rel_freq:0.0012982679819694065},教:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0014356366764062282,aozora_rel_freq:0.0011605435549020204,news_rel_freq:0.0011309724211357522,twitter_rel_freq:0.0010576811016515298,wikipedia_rel_freq:0.0018916901752387802},文:{jlpt_level:4,joyo_grade:1,frequency:500,nhk_rel_freq:0.0010877951909333537,aozora_rel_freq:0.003445927011554114,news_rel_freq:0.0011396945734838428,twitter_rel_freq:0.0008340907950559456,wikipedia_rel_freq:0.0026472889598144625},元:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0004996268609519473,aozora_rel_freq:0.0007281175359599697,news_rel_freq:0.001444679167255412,twitter_rel_freq:0.001370927423006273,wikipedia_rel_freq:0.0014946992447681705},重:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0005375732048217154,aozora_rel_freq:0.0011135343924277485,news_rel_freq:0.0012350567724896337,twitter_rel_freq:0.0007298419395444594,wikipedia_rel_freq:0.0012123693744943906},近:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0028459757902326113,aozora_rel_freq:0.0015155015821302711,news_rel_freq:0.0014346971484570416,twitter_rel_freq:0.0025709386974750188,wikipedia_rel_freq:0.0010345688292102396},考:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.005173351547578391,aozora_rel_freq:0.0018781908683109022,news_rel_freq:0.0007706506163557413,twitter_rel_freq:0.001079070607959735,wikipedia_rel_freq:0.0011679409062446224},画:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0021566172099318232,aozora_rel_freq:0.000707565596332788,news_rel_freq:0.0011005418007213027,twitter_rel_freq:0.0019672348745705358,wikipedia_rel_freq:0.003614640882761404},海:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0034657660734388244,aozora_rel_freq:0.0009899702261059128,news_rel_freq:0.001956378771676729,twitter_rel_freq:0.0015558367065117854,wikipedia_rel_freq:0.0020161745192753253},売:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0025930001644341566,aozora_rel_freq:0.0004997345924847578,news_rel_freq:0.0013861438337193371,twitter_rel_freq:0.0008255949631110977,wikipedia_rel_freq:0.0012095385047126328},知:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.001998507443807789,aozora_rel_freq:0.0033171180213198595,news_rel_freq:0.0014827658991754078,twitter_rel_freq:0.0025394541437970533,wikipedia_rel_freq:0.0012542983669935838},道:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0026056489457240797,aozora_rel_freq:0.0018738396069909696,news_rel_freq:0.001964325621593878,twitter_rel_freq:0.0017143589355062406,wikipedia_rel_freq:0.004209165598480675},集:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.002314726976055857,aozora_rel_freq:0.0009048098259872322,news_rel_freq:0.0012892310298516633,twitter_rel_freq:0.0009978104741813667,wikipedia_rel_freq:0.0014496538737834314},別:{jlpt_level:4,joyo_grade:4,frequency:500,nhk_rel_freq:0.0008095220025550538,aozora_rel_freq:0.001147722874227219,news_rel_freq:0.0009129186124334863,twitter_rel_freq:0.000671970331355437,wikipedia_rel_freq:0.001452911732028444},物:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.00703272239719703,aozora_rel_freq:0.003593500816230578,news_rel_freq:0.0013046401656666234,twitter_rel_freq:0.001650390318509739,wikipedia_rel_freq:0.0031015065411006356},使:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.005736222314979952,aozora_rel_freq:0.0007241159295675317,news_rel_freq:0.0011154663725169243,twitter_rel_freq:0.0013326462037724293,wikipedia_rel_freq:0.001395602232705085},品:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0016063952238201849,aozora_rel_freq:0.0007846256572978441,news_rel_freq:0.0009638947472678827,twitter_rel_freq:0.0008374891278338847,wikipedia_rel_freq:0.00158643803474657},計:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.001359743988666692,aozora_rel_freq:0.0005158575696970081,news_rel_freq:0.0014323712411642175,twitter_rel_freq:0.0004182947845786857,wikipedia_rel_freq:0.0009303849187684975},死:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.00043005856385737234,aozora_rel_freq:0.0014581387487474099,news_rel_freq:0.0015802601798662874,twitter_rel_freq:0.0013448402213873873,wikipedia_rel_freq:0.0007599030832037763},特:{jlpt_level:4,joyo_grade:4,frequency:500,nhk_rel_freq:0.0009423342060992423,aozora_rel_freq:0.0006269701355452867,news_rel_freq:0.0010964714629588604,twitter_rel_freq:0.0006309904360920532,wikipedia_rel_freq:0.0019374365720587138},私:{jlpt_level:4,joyo_grade:6,frequency:500,nhk_rel_freq:0.0005375732048217154,aozora_rel_freq:0.00587255163364027,news_rel_freq:0.0003291158819346199,twitter_rel_freq:0.001909163364453399,wikipedia_rel_freq:0.0003804212289114684},始:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.003763012433752008,aozora_rel_freq:0.0007648507286206505,news_rel_freq:0.001087943136218505,twitter_rel_freq:0.0010830686465220162,wikipedia_rel_freq:0.0008752396773872478},朝:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0012142830038325808,aozora_rel_freq:0.0010143295193880354,news_rel_freq:0.0008712461067703866,twitter_rel_freq:0.0019440462509093038,wikipedia_rel_freq:0.000971252175775478},運:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.002011156225097712,aozora_rel_freq:0.0006862560710293681,news_rel_freq:0.0011636320360391582,twitter_rel_freq:0.001105957417291077,wikipedia_rel_freq:0.0010858138177629528},終:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0013154732541519624,aozora_rel_freq:0.0005920629186170774,news_rel_freq:0.0014023282719652385,twitter_rel_freq:0.0025022723851678367,wikipedia_rel_freq:0.000984453129548403},台:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0016822879115597211,aozora_rel_freq:0.0006065153222868535,news_rel_freq:0.001742007649521435,twitter_rel_freq:0.0010331931154575565,wikipedia_rel_freq:0.0011270532557588},広:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.001005578112548856,aozora_rel_freq:0.0005023570044409673,news_rel_freq:0.001336233739727485,twitter_rel_freq:0.0007919114882238774,wikipedia_rel_freq:0.001059663004925345},住:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0017075854741395665,aozora_rel_freq:0.0005206167617656844,news_rel_freq:0.0009657360905413685,twitter_rel_freq:0.000407300178532412,wikipedia_rel_freq:0.0005965003339820911},真:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.001132065925448083,aozora_rel_freq:0.0013923453465571791,news_rel_freq:0.0007556291317562519,twitter_rel_freq:0.0020266057472204135,wikipedia_rel_freq:0.0009351684641493789},有:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0008031976119100924,aozora_rel_freq:0.0012324559183234062,news_rel_freq:0.0007872227058171135,twitter_rel_freq:0.0006786670459472582,wikipedia_rel_freq:0.0010889990242395908},口:{jlpt_level:4,joyo_grade:1,frequency:500,nhk_rel_freq:0.0010308756751287013,aozora_rel_freq:0.0019522594371185046,news_rel_freq:0.0008976063894223939,twitter_rel_freq:0.0012834703294563688,wikipedia_rel_freq:0.0013396208586913124},少:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.002245158678961282,aozora_rel_freq:0.0020953654288325377,news_rel_freq:0.0008395556199056574,twitter_rel_freq:0.0011073567307878754,wikipedia_rel_freq:0.000844645635346935},町:{jlpt_level:4,joyo_grade:1,frequency:500,nhk_rel_freq:0.001694936692849644,aozora_rel_freq:0.0009493131281477927,news_rel_freq:0.00120230024478236,twitter_rel_freq:0.001367629041192391,wikipedia_rel_freq:0.0024865768752074966},料:{jlpt_level:4,joyo_grade:4,frequency:500,nhk_rel_freq:0.0019352635373581755,aozora_rel_freq:0.0004473834797293189,news_rel_freq:0.0007212250863832278,twitter_rel_freq:0.000767123649137733,wikipedia_rel_freq:0.0006568917977954504},工:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0018783440215535234,aozora_rel_freq:0.0005509007635414652,news_rel_freq:0.0008959588717566434,twitter_rel_freq:0.00046457208093709227,wikipedia_rel_freq:0.0010798296063152476},建:{jlpt_level:4,joyo_grade:4,frequency:500,nhk_rel_freq:0.0023906196637953933,aozora_rel_freq:0.00037626755253167065,news_rel_freq:0.0006269289282199813,twitter_rel_freq:0.00010824689407376741,wikipedia_rel_freq:0.000823645450509365},空:{jlpt_level:4,joyo_grade:1,frequency:500,nhk_rel_freq:0.003016734337646568,aozora_rel_freq:0.001995849751412829,news_rel_freq:0.001114981808497586,twitter_rel_freq:0.0012474879823958366,wikipedia_rel_freq:0.001369872035368594},急:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0008284951744899379,aozora_rel_freq:0.000757585676238263,news_rel_freq:0.0005566671454159178,twitter_rel_freq:0.0008120016319993411,wikipedia_rel_freq:0.0005510317983113799},止:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0009170366435193969,aozora_rel_freq:0.000576988906187311,news_rel_freq:0.0010538298292570838,twitter_rel_freq:0.0007266435086946344,wikipedia_rel_freq:0.0007960989589635064},送:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0008664415183597061,aozora_rel_freq:0.00048164966262378804,news_rel_freq:0.0008927607492290101,twitter_rel_freq:0.0007911118805114211,wikipedia_rel_freq:0.00247601305316733},切:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.001182661050607774,aozora_rel_freq:0.0015288467451963143,news_rel_freq:0.0007760777333723311,twitter_rel_freq:0.0013805227155557482,wikipedia_rel_freq:0.0005387358051620695},転:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0014229878951163056,aozora_rel_freq:0.0003517140065120511,news_rel_freq:0.0011134312036357031,twitter_rel_freq:0.0008351902556605729,wikipedia_rel_freq:0.0012093817298440349},研:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0020048318344527503,aozora_rel_freq:0.0003484699857958513,news_rel_freq:0.0005609313087860954,twitter_rel_freq:0.00021659373911159184,wikipedia_rel_freq:0.0009169315956949024},足:{jlpt_level:4,joyo_grade:1,frequency:500,nhk_rel_freq:0.0010119025031938172,aozora_rel_freq:0.0015381126007749208,news_rel_freq:0.0005299192115484398,twitter_rel_freq:0.0011658280447612401,wikipedia_rel_freq:0.00048271746796789585},究:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0019226147560682527,aozora_rel_freq:0.0003715083604629944,news_rel_freq:0.0005064663130124628,twitter_rel_freq:0.0003348357295910626,wikipedia_rel_freq:0.0008186643433022015},楽:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0014419610670511895,aozora_rel_freq:0.0008149873601686239,news_rel_freq:0.0006741254637035383,twitter_rel_freq:0.004483000639886072,wikipedia_rel_freq:0.0013547260535511111},起:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0012079586131876195,aozora_rel_freq:0.0010849015389206922,news_rel_freq:0.0007418675136070422,twitter_rel_freq:0.0014007128102952692,wikipedia_rel_freq:0.0005760469492959726},着:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0011067683628682376,aozora_rel_freq:0.0011568527528895774,news_rel_freq:0.0006458269249741776,twitter_rel_freq:0.0014532870173892688,wikipedia_rel_freq:0.0006146173907483706},店:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0019542367092930594,aozora_rel_freq:0.0005920823438908271,news_rel_freq:0.0007804388095463764,twitter_rel_freq:0.004172253092632755,wikipedia_rel_freq:0.000932292983632654},病:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0022325098976713593,aozora_rel_freq:0.000770309230544316,news_rel_freq:0.0005812829975983069,twitter_rel_freq:0.0006791668007675435,wikipedia_rel_freq:0.00041344846789611976},質:{jlpt_level:4,joyo_grade:5,frequency:500,nhk_rel_freq:0.0007020073615907108,aozora_rel_freq:0.0006284076058027644,news_rel_freq:0.000522456925650629,twitter_rel_freq:0.0002708671125945611,wikipedia_rel_freq:0.0004472557574464784},待:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0003794634386976815,aozora_rel_freq:0.000843697914770679,news_rel_freq:0.0005275933042556156,twitter_rel_freq:0.0016564873273172181,wikipedia_rel_freq:0.00019102316712834593},試:{jlpt_level:4,joyo_grade:4,frequency:500,nhk_rel_freq:0.0010688220189984696,aozora_rel_freq:0.00023314213554388806,news_rel_freq:0.0010910443459422705,twitter_rel_freq:0.0008790687288816107,wikipedia_rel_freq:0.0005869663826234468},族:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.00116368787867289,aozora_rel_freq:0.00038930191121771873,news_rel_freq:0.0005310821651948519,twitter_rel_freq:0.0004293893415890164,wikipedia_rel_freq:0.0007114825914706827},銀:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0004743292983721018,aozora_rel_freq:0.00038337720272406053,news_rel_freq:0.0005421302248357667,twitter_rel_freq:0.00026257118257782733,wikipedia_rel_freq:0.00042108964949973913},早:{jlpt_level:4,joyo_grade:1,frequency:500,nhk_rel_freq:0.0008854146902945901,aozora_rel_freq:0.0009921847073133786,news_rel_freq:0.0005589930527087419,twitter_rel_freq:0.002027805158789098,wikipedia_rel_freq:0.0003189769517528898},映:{jlpt_level:4,joyo_grade:6,frequency:500,nhk_rel_freq:0.0010435244564186241,aozora_rel_freq:0.0002771403805869564,news_rel_freq:0.0005613189600015661,twitter_rel_freq:0.000561924319928643,wikipedia_rel_freq:0.0014978678815432494},親:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0005186000328868313,aozora_rel_freq:0.0013805736306648614,news_rel_freq:0.0006245061081232893,twitter_rel_freq:0.0006357880823667909,wikipedia_rel_freq:0.0005450208204226945},験:{jlpt_level:4,joyo_grade:4,frequency:500,nhk_rel_freq:0.0007968732212651311,aozora_rel_freq:0.0003349499952660608,news_rel_freq:0.0005177081982611129,twitter_rel_freq:0.00043288762533101263,wikipedia_rel_freq:0.000393668068011788},英:{jlpt_level:4,joyo_grade:4,frequency:500,nhk_rel_freq:0.0006071415019162904,aozora_rel_freq:0.00028860129209927883,news_rel_freq:0.0006064803266039021,twitter_rel_freq:0.00037981366341672775,wikipedia_rel_freq:0.0008902059416724353},医:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0004110853919224883,aozora_rel_freq:0.00030262633974656157,news_rel_freq:0.0004971626838411661,twitter_rel_freq:0.00020150114353897978,wikipedia_rel_freq:0.00047149085786536384},仕:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0017898025525240643,aozora_rel_freq:0.0012316206315521692,news_rel_freq:0.00033589977820535705,twitter_rel_freq:0.0023847300514367653,wikipedia_rel_freq:0.0003574683684747749},去:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0029787879937767997,aozora_rel_freq:0.0006025137158944155,news_rel_freq:0.0006679230442560072,twitter_rel_freq:0.00035592538300709673,wikipedia_rel_freq:0.000608119518552332},味:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.00051227564224187,aozora_rel_freq:0.0016273523083810382,news_rel_freq:0.0002985883487163027,twitter_rel_freq:0.0023950250007346396,wikipedia_rel_freq:0.00048390028974073303},写:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0011194171441581604,aozora_rel_freq:0.00032694678248118477,news_rel_freq:0.0004101349859679951,twitter_rel_freq:0.0014041111430732082,wikipedia_rel_freq:0.0003835312344348764},字:{jlpt_level:4,joyo_grade:1,frequency:500,nhk_rel_freq:0.0005186000328868313,aozora_rel_freq:0.0010842993554344516,news_rel_freq:0.00030498459377156914,twitter_rel_freq:0.0003909082204270585,wikipedia_rel_freq:0.0008024069168878288},答:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0008284951744899379,aozora_rel_freq:0.0005213549221681729,news_rel_freq:0.00033589977820535705,twitter_rel_freq:0.00018201070554785823,wikipedia_rel_freq:0.00012150307234832743},夜:{jlpt_level:4,joyo_grade:2,frequency:500,nhk_rel_freq:0.0009296854248093196,aozora_rel_freq:0.0016996337520036684,news_rel_freq:0.0004120732420453486,twitter_rel_freq:0.001670980217105488,wikipedia_rel_freq:0.0003810865661586893},音:{jlpt_level:4,joyo_grade:1,frequency:500,nhk_rel_freq:0.0004743292983721018,aozora_rel_freq:0.0013128765516471602,news_rel_freq:0.00028143478243172445,twitter_rel_freq:0.0008628766727043712,wikipedia_rel_freq:0.0012647780659335267},注:{jlpt_level:4,joyo_grade:3,frequency:500,nhk_rel_freq:0.0004363829545023337,aozora_rel_freq:0.0005129243533608035,news_rel_freq:0.0005892298475154562,twitter_rel_freq:0.0006736694977444066,wikipedia_rel_freq:0.0011624155480708628},帰:{jlpt_level:4,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0005881683299814063,aozora_rel_freq:0.0013586813471489507,news_rel_freq:0.0004887312699046785,twitter_rel_freq:0.003165047227830027,wikipedia_rel_freq:0.000490441498079311},古:{jlpt_level:4,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0007020073615907108,aozora_rel_freq:0.0010389024906814048,news_rel_freq:0.0008593258318946627,twitter_rel_freq:0.0010691754625180886,wikipedia_rel_freq:0.0010456310168896078},歌:{jlpt_level:4,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0006387634551410971,aozora_rel_freq:0.000790511515244003,news_rel_freq:0.0003527626060783323,twitter_rel_freq:0.0008875645608264585,wikipedia_rel_freq:0.0010640348569521032},買:{jlpt_level:4,joyo_grade:2,frequency:1000,nhk_rel_freq:0.001182661050607774,aozora_rel_freq:0.0004764825398063681,news_rel_freq:0.0005542443253192259,twitter_rel_freq:0.0023678383385111264,wikipedia_rel_freq:0.00013308019536845665},悪:{jlpt_level:4,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0005691951580465223,aozora_rel_freq:0.0011383987428273633,news_rel_freq:0.00033221709165838547,twitter_rel_freq:0.0016962678110119176,wikipedia_rel_freq:0.0003292960520469519},図:{jlpt_level:4,joyo_grade:2,frequency:1000,nhk_rel_freq:0.000265624407088377,aozora_rel_freq:0.0007213963912425737,news_rel_freq:0.0002509072492134072,twitter_rel_freq:0.0001968034482282992,wikipedia_rel_freq:0.0006178574046993966},週:{jlpt_level:4,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0005944927206263677,aozora_rel_freq:0.00011723152707943379,news_rel_freq:0.0005657769489794791,twitter_rel_freq:0.0016165069416944047,wikipedia_rel_freq:0.00033904795871072033},室:{jlpt_level:4,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0001517853754790726,aozora_rel_freq:0.0007640542923969129,news_rel_freq:0.0004530673580813746,twitter_rel_freq:0.00042828988098438906,wikipedia_rel_freq:0.0005262269550773455},歩:{jlpt_level:4,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0006577366270759812,aozora_rel_freq:0.001281329907077649,news_rel_freq:0.00032640232342632505,twitter_rel_freq:0.0008017066827014667,wikipedia_rel_freq:0.00030782681719601537},風:{jlpt_level:4,joyo_grade:2,frequency:1000,nhk_rel_freq:0.000777900049330247,aozora_rel_freq:0.0017728864593137836,news_rel_freq:0.0019168383476987183,twitter_rel_freq:0.0017029645256037389,wikipedia_rel_freq:0.0005809248145164983},紙:{jlpt_level:4,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0005628707674015608,aozora_rel_freq:0.0008451548103019064,news_rel_freq:0.00033202326605065013,twitter_rel_freq:0.00019870251654538284,wikipedia_rel_freq:0.00023630051393491315},黒:{jlpt_level:4,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0002909219696682225,aozora_rel_freq:0.0007470377525921765,news_rel_freq:0.00038474383135466463,twitter_rel_freq:0.0006775675853426309,wikipedia_rel_freq:0.00047080512713930096},花:{jlpt_level:4,joyo_grade:1,frequency:1000,nhk_rel_freq:0.0008854146902945901,aozora_rel_freq:0.0011061722136766125,news_rel_freq:0.000353150257293803,twitter_rel_freq:0.0008076037895808317,wikipedia_rel_freq:0.0005820693985165067},春:{jlpt_level:4,joyo_grade:2,frequency:1000,nhk_rel_freq:0.000531248814176754,aozora_rel_freq:0.0005812041905909957,news_rel_freq:0.00045025688676921205,twitter_rel_freq:0.0003183438205216521,wikipedia_rel_freq:0.0004959247947029591},赤:{jlpt_level:4,joyo_grade:1,frequency:1000,nhk_rel_freq:0.0013407708167318079,aozora_rel_freq:0.0007042438745215895,news_rel_freq:0.000326111585014722,twitter_rel_freq:0.000612399556777445,wikipedia_rel_freq:0.0004312685446267623},青:{jlpt_level:4,joyo_grade:1,frequency:1000,nhk_rel_freq:0.0003731390480527201,aozora_rel_freq:0.0016935730665937623,news_rel_freq:0.0005500770747529159,twitter_rel_freq:0.0006372873468276464,wikipedia_rel_freq:0.0006395445948554571},館:{jlpt_level:4,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0015052049735008032,aozora_rel_freq:0.0005271242284718335,news_rel_freq:0.0007331453612589516,twitter_rel_freq:0.0006933598376636422,wikipedia_rel_freq:0.0010728703316604082},屋:{jlpt_level:4,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0009423342060992423,aozora_rel_freq:0.0023346459508813305,news_rel_freq:0.0008739596652786815,twitter_rel_freq:0.0022574924741921615,wikipedia_rel_freq:0.0009519064119089668},色:{jlpt_level:4,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0008411439557798606,aozora_rel_freq:0.0015057306694341724,news_rel_freq:0.0002816286080394598,twitter_rel_freq:0.0011346433439754456,wikipedia_rel_freq:0.0007382095200855774},走:{jlpt_level:4,joyo_grade:2,frequency:1000,nhk_rel_freq:0.001555800098660494,aozora_rel_freq:0.0004903521852636533,news_rel_freq:0.0004563623934128755,twitter_rel_freq:0.0007474333092184974,wikipedia_rel_freq:0.0005043778916829763},秋:{jlpt_level:4,joyo_grade:2,frequency:1000,nhk_rel_freq:0.00038578782934264286,aozora_rel_freq:0.0004596602527391287,news_rel_freq:0.00042331512729399876,twitter_rel_freq:0.0004944574191901453,wikipedia_rel_freq:0.00044919313793647026},夏:{jlpt_level:4,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0004490317357922564,aozora_rel_freq:0.0003345032139698177,news_rel_freq:0.00036875321871649846,twitter_rel_freq:0.00086527549584174,wikipedia_rel_freq:0.0003647475658289484},習:{jlpt_level:4,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0005186000328868313,aozora_rel_freq:0.0002873774998530478,news_rel_freq:0.0005250735713550562,twitter_rel_freq:0.0009756213601607052,wikipedia_rel_freq:0.0002596803628348615},駅:{jlpt_level:4,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0016633147396248372,aozora_rel_freq:0.00012206842024310885,news_rel_freq:0.00043164962842661867,twitter_rel_freq:0.0044067380543105555,wikipedia_rel_freq:0.0027495023503630945},洋:{jlpt_level:4,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0004363829545023337,aozora_rel_freq:0.0004843497756749962,news_rel_freq:0.0004074214274597003,twitter_rel_freq:0.00016252026755673668,wikipedia_rel_freq:0.0005619244651978738},旅:{jlpt_level:4,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0013154732541519624,aozora_rel_freq:0.0005025124066309648,news_rel_freq:0.00022222105926857582,twitter_rel_freq:0.00044847997572390987,wikipedia_rel_freq:0.0004186194893749994},服:{jlpt_level:4,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0003921122199876042,aozora_rel_freq:0.0004662648458140264,news_rel_freq:0.00018016090239000542,twitter_rel_freq:0.0005162467293545786,wikipedia_rel_freq:0.0002047352324647491},夕:{jlpt_level:4,joyo_grade:1,frequency:1000,nhk_rel_freq:0.00017708293805891801,aozora_rel_freq:0.000456416232022929,news_rel_freq:0.00010747629948925014,twitter_rel_freq:0.0003472296491341348,wikipedia_rel_freq:0.00011869259604541155},借:{jlpt_level:4,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00017075854741395666,aozora_rel_freq:0.00022032145486908667,news_rel_freq:0.00009303629171296675,twitter_rel_freq:0.000163519777197307,wikipedia_rel_freq:0.000059566802512685115},曜:{jlpt_level:4,joyo_grade:2,frequency:1000,nhk_rel_freq:0.00014546098483411124,aozora_rel_freq:0.00017416700443980172,news_rel_freq:0.00005242982689241147,twitter_rel_freq:0.0015063609793035536,wikipedia_rel_freq:0.0006713482251095873},飲:{jlpt_level:4,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0005691951580465223,aozora_rel_freq:0.00040163696004877765,news_rel_freq:0.00018859231632649303,twitter_rel_freq:0.0014284991783031244,wikipedia_rel_freq:0.00008997602865099216},肉:{jlpt_level:4,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0004110853919224883,aozora_rel_freq:0.00043588371766949705,news_rel_freq:0.00012211013287326887,twitter_rel_freq:0.0008004073201687252,wikipedia_rel_freq:0.00014528951623268848},貸:{jlpt_level:4,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0001517853754790726,aozora_rel_freq:0.00012018416868938805,news_rel_freq:0.00006619144504162114,twitter_rel_freq:0.000136732918830022,wikipedia_rel_freq:0.000057614126913561706},堂:{jlpt_level:4,joyo_grade:4,frequency:1500,nhk_rel_freq:0.00014546098483411124,aozora_rel_freq:0.00037824893045414,news_rel_freq:0.0001695004939645613,twitter_rel_freq:0.000336035141159747,wikipedia_rel_freq:0.0003993642215708497},鳥:{jlpt_level:4,joyo_grade:2,frequency:1500,nhk_rel_freq:0.0003288683135379906,aozora_rel_freq:0.0004528419816529843,news_rel_freq:0.000270580548398545,twitter_rel_freq:0.00040300228707795956,wikipedia_rel_freq:0.00037855395100499595},飯:{jlpt_level:4,joyo_grade:4,frequency:1500,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00030284001775780827,news_rel_freq:0.00009293937890909908,twitter_rel_freq:0.0012653792049620457,wikipedia_rel_freq:0.00015180395813028623},勉:{jlpt_level:4,joyo_grade:3,frequency:1500,nhk_rel_freq:0.00043005856385737234,aozora_rel_freq:0.00012542899260180678,news_rel_freq:0.00004961935558024894,twitter_rel_freq:0.0007664239923893338,wikipedia_rel_freq:0.00004451641512727437},冬:{jlpt_level:4,joyo_grade:2,frequency:1500,nhk_rel_freq:0.00039843661063256557,aozora_rel_freq:0.00024163098017250653,news_rel_freq:0.00016523633059438366,twitter_rel_freq:0.0000888564070467029,wikipedia_rel_freq:0.00014918212150665905},昼:{jlpt_level:4,joyo_grade:2,frequency:1500,nhk_rel_freq:0.00025930001644341565,aozora_rel_freq:0.00023720201775757514,news_rel_freq:0.000054464995773632624,twitter_rel_freq:0.0007975087422110713,wikipedia_rel_freq:0.00005613050132780475},茶:{jlpt_level:4,joyo_grade:2,frequency:1500,nhk_rel_freq:0.00023400245386357023,aozora_rel_freq:0.0006010568203631882,news_rel_freq:0.00007801480711347733,twitter_rel_freq:0.0004556764451360163,wikipedia_rel_freq:0.00015221565148440953},弟:{jlpt_level:4,joyo_grade:2,frequency:1500,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.0004086689091461687,news_rel_freq:0.0000792746735637571,twitter_rel_freq:0.00023078677600769064,wikipedia_rel_freq:0.0002566136934539927},牛:{jlpt_level:4,joyo_grade:2,frequency:1500,nhk_rel_freq:0.0003415170948279133,aozora_rel_freq:0.00025528694761854496,news_rel_freq:0.00007733641748640362,twitter_rel_freq:0.00021729339585999108,wikipedia_rel_freq:0.00010010394008091033},魚:{jlpt_level:4,joyo_grade:2,frequency:1500,nhk_rel_freq:0.0006703854083659039,aozora_rel_freq:0.0002796268156269179,news_rel_freq:0.00008935360516599515,twitter_rel_freq:0.00022199109117067168,wikipedia_rel_freq:0.00018368406393007397},兄:{jlpt_level:4,joyo_grade:2,frequency:1500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.0005644596046187551,news_rel_freq:0.00004874714034543987,twitter_rel_freq:0.0003220420061917623,wikipedia_rel_freq:0.00021700828295036226},犬:{jlpt_level:4,joyo_grade:1,frequency:1500,nhk_rel_freq:0.00020870489128372482,aozora_rel_freq:0.00031346564249889363,news_rel_freq:0.00007607655103612386,twitter_rel_freq:0.00021539432754290745,wikipedia_rel_freq:0.00014408247720372643},妹:{jlpt_level:4,joyo_grade:2,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00024133960106626105,news_rel_freq:0.00004157559285923202,twitter_rel_freq:0.00021459471983045119,wikipedia_rel_freq:0.00015513829192095651},姉:{jlpt_level:4,joyo_grade:2,frequency:1500,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00031294116010765176,news_rel_freq:0.00004332002332885015,twitter_rel_freq:0.0003170444579889106,wikipedia_rel_freq:0.00014259120406340373},漢:{jlpt_level:4,joyo_grade:3,frequency:1500,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.00016723218171115915,news_rel_freq:0.000030624446022184894,twitter_rel_freq:0.00009735223899155075,wikipedia_rel_freq:0.00015980330020606858},政:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.0024475391796000457,aozora_rel_freq:0.0006252218609078137,news_rel_freq:0.0024490834665399823,twitter_rel_freq:0.00027056725970239,wikipedia_rel_freq:0.0014561096844293584},議:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0015241781454356873,aozora_rel_freq:0.0006705215992921119,news_rel_freq:0.0027915733154083413,twitter_rel_freq:0.00031264661557040116,wikipedia_rel_freq:0.0017876974536611822},民:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0017455318180093348,aozora_rel_freq:0.0009260416501956533,news_rel_freq:0.002257002289274253,twitter_rel_freq:0.00048796060652643813,wikipedia_rel_freq:0.001490080121810453},連:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0011194171441581604,aozora_rel_freq:0.0007685998064543425,news_rel_freq:0.003130768128945199,twitter_rel_freq:0.0014307980504764362,wikipedia_rel_freq:0.0023050328519634068},対:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0005059512515969086,aozora_rel_freq:0.0013495903190340914,news_rel_freq:0.0028843188687097047,twitter_rel_freq:0.0017829252968493657,wikipedia_rel_freq:0.002029747654037117},部:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0025550538205643884,aozora_rel_freq:0.0017312969482156779,news_rel_freq:0.003847825964762117,twitter_rel_freq:0.0023823312282993964,wikipedia_rel_freq:0.004827938160543107},合:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.0037883099963318535,aozora_rel_freq:0.0027102918946530106,news_rel_freq:0.0038446278422344837,twitter_rel_freq:0.0032744935334724783,wikipedia_rel_freq:0.004180811015335701},市:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.005053188125324125,aozora_rel_freq:0.0004908960929286448,news_rel_freq:0.005673857015236825,twitter_rel_freq:0.007280528172878386,wikipedia_rel_freq:0.005108896569364761},内:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.0010688220189984696,aozora_rel_freq:0.0016954767434212328,news_rel_freq:0.003895797802676615,twitter_rel_freq:0.0012554840595203993,wikipedia_rel_freq:0.002651079597694223},相:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0010435244564186241,aozora_rel_freq:0.0016501381544894351,news_rel_freq:0.0027186948868998507,twitter_rel_freq:0.001091064723646579,wikipedia_rel_freq:0.0008968414698506575},定:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.001998507443807789,aozora_rel_freq:0.0009497599094440358,news_rel_freq:0.003667277411156641,twitter_rel_freq:0.0019784293825449236,wikipedia_rel_freq:0.002881741314729318},回:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.0016127196144651464,aozora_rel_freq:0.00034483745960465763,news_rel_freq:0.0036619472069439186,twitter_rel_freq:0.003202029084531129,wikipedia_rel_freq:0.0023833998927835793},選:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0027131635866884224,aozora_rel_freq:0.00023450190470636697,news_rel_freq:0.0034854689911008848,twitter_rel_freq:0.0010248971854408227,wikipedia_rel_freq:0.002674583082059651},米:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.00022135367257364753,aozora_rel_freq:0.0004220140722122119,news_rel_freq:0.003368979800851941,twitter_rel_freq:0.00035752459843200926,wikipedia_rel_freq:0.0005682222263827751},実:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.000423734173212411,aozora_rel_freq:0.002255157730697562,news_rel_freq:0.0019716909946878216,twitter_rel_freq:0.0015497396977043063,wikipedia_rel_freq:0.0015516008745146892},関:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0013913659418914987,aozora_rel_freq:0.0010103861888168465,news_rel_freq:0.0027585260492894643,twitter_rel_freq:0.0011698260833235214,wikipedia_rel_freq:0.002941648433420179},決:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.002668892852173693,aozora_rel_freq:0.0008220387345397646,news_rel_freq:0.0031151651675225037,twitter_rel_freq:0.0009314430340474963,wikipedia_rel_freq:0.000977973101646351},全:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.00307365385345122,aozora_rel_freq:0.0015418616786086127,news_rel_freq:0.002775873441181778,twitter_rel_freq:0.0029059743289941956,wikipedia_rel_freq:0.0022022599153390474},表:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.002137644037996939,aozora_rel_freq:0.0013038049488060509,news_rel_freq:0.004159594454804423,twitter_rel_freq:0.0008260947179313828,wikipedia_rel_freq:0.0021555116888709995},戦:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0011510390973829671,aozora_rel_freq:0.0007672594625656133,news_rel_freq:0.003748005776778413,twitter_rel_freq:0.001245289061186582,wikipedia_rel_freq:0.0032929592458770915},経:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.0010498488470635854,aozora_rel_freq:0.0007218043219913174,news_rel_freq:0.002026155990461454,twitter_rel_freq:0.0005479311849606583,wikipedia_rel_freq:0.0014999467417927078},最:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0021629416005767843,aozora_rel_freq:0.0012214223628335772,news_rel_freq:0.002876856582811894,twitter_rel_freq:0.0054632197443934,wikipedia_rel_freq:0.0017932381069440736},現:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.00015810976612403395,aozora_rel_freq:0.0015831792358742226,news_rel_freq:0.0018525851587344506,twitter_rel_freq:0.0011384414806096129,wikipedia_rel_freq:0.0020949456058950554},調:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.004363829545023337,aozora_rel_freq:0.0007810319816541499,news_rel_freq:0.00224294993271344,twitter_rel_freq:0.0010881661456889251,wikipedia_rel_freq:0.000680390183791168},化:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0013407708167318079,aozora_rel_freq:0.0010445163947950678,news_rel_freq:0.0018233174919664132,twitter_rel_freq:0.0009972107683970245,wikipedia_rel_freq:0.001970314683729333},当:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.0006830341896558266,aozora_rel_freq:0.0018729848949459828,news_rel_freq:0.0019008477350605521,twitter_rel_freq:0.0024389034739556773,wikipedia_rel_freq:0.0020749701933692965},約:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0064382296765706625,aozora_rel_freq:0.00032533448475995975,news_rel_freq:0.0031692425120806657,twitter_rel_freq:0.0006652736167636157,wikipedia_rel_freq:0.000788502388094854},首:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.0009296854248093196,aozora_rel_freq:0.0005662467298037274,news_rel_freq:0.0019239129823810585,twitter_rel_freq:0.00027926299357535194,wikipedia_rel_freq:0.0003997198328581574},法:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0007020073615907108,aozora_rel_freq:0.0011727232015430816,news_rel_freq:0.002216589650061433,twitter_rel_freq:0.0006186964675130381,wikipedia_rel_freq:0.0018985742489403897},性:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.004389127107603182,aozora_rel_freq:0.0012583109576842556,news_rel_freq:0.0028919749802152513,twitter_rel_freq:0.0010000093953906213,wikipedia_rel_freq:0.0018291752404409956},要:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0016127196144651464,aozora_rel_freq:0.0009552766871889504,news_rel_freq:0.0015466314369242046,twitter_rel_freq:0.0005219439343058295,wikipedia_rel_freq:0.0016981050773309055},制:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.00035416587611783603,aozora_rel_freq:0.0005547275424701559,news_rel_freq:0.0018528758971460535,twitter_rel_freq:0.000496556389435343,wikipedia_rel_freq:0.0014260344015070894},治:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0005565463767565995,aozora_rel_freq:0.0007834601408728622,news_rel_freq:0.001024659075292914,twitter_rel_freq:0.0005426337838656355,wikipedia_rel_freq:0.0015120655665945783},務:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.000689358580300788,aozora_rel_freq:0.00029639082687290814,news_rel_freq:0.001777671561344739,twitter_rel_freq:0.0002880586784123709,wikipedia_rel_freq:0.0011629687211844526},成:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0010435244564186241,aozora_rel_freq:0.0019139139467365988,news_rel_freq:0.0017832925039690639,twitter_rel_freq:0.0012057084794199965,wikipedia_rel_freq:0.0032368733552842538},期:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.0004231018875421951,news_rel_freq:0.001822445276731604,twitter_rel_freq:0.00108766639086864,wikipedia_rel_freq:0.0017052721105514479},取:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0011383903160930445,aozora_rel_freq:0.0018103772376507027,news_rel_freq:0.0022458573168294706,twitter_rel_freq:0.0013155545889186764,wikipedia_rel_freq:0.0011582208643915448},都:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0021123464754170935,aozora_rel_freq:0.0005518331766814508,news_rel_freq:0.0020392392189835904,twitter_rel_freq:0.004189344707486507,wikipedia_rel_freq:0.0017943877893137924},和:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0006577366270759812,aozora_rel_freq:0.0011234995578613442,news_rel_freq:0.0012252685792989986,twitter_rel_freq:0.0009724229293108801,wikipedia_rel_freq:0.0025276531653726075},機:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0038262563402016217,aozora_rel_freq:0.0008244280432109775,news_rel_freq:0.0019174198245219243,twitter_rel_freq:0.0008302926584217783,wikipedia_rel_freq:0.0021545901585458254},平:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.001359743988666692,aozora_rel_freq:0.0015704168310206703,news_rel_freq:0.001824868096828296,twitter_rel_freq:0.0008487835867723295,wikipedia_rel_freq:0.002104134142705813},加:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0003415170948279133,aozora_rel_freq:0.0006317293276139629,news_rel_freq:0.0015485696930015581,twitter_rel_freq:0.0008788688269534967,wikipedia_rel_freq:0.001453031543716641},受:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0006767097990108653,aozora_rel_freq:0.0007287585699937097,news_rel_freq:0.001703920917601439,twitter_rel_freq:0.0006476822470895779,wikipedia_rel_freq:0.0010459483904040865},続:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.002264131850896166,aozora_rel_freq:0.0005024735560834654,news_rel_freq:0.0020815901142737635,twitter_rel_freq:0.0008037057019826073,wikipedia_rel_freq:0.0010354648676868608},進:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0005755195486914836,aozora_rel_freq:0.0007176861639563813,news_rel_freq:0.0017550908780435707,twitter_rel_freq:0.0005441330483264911,wikipedia_rel_freq:0.0008252833017788647},数:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.0005691951580465223,aozora_rel_freq:0.0010096091778668587,news_rel_freq:0.001701304271897012,twitter_rel_freq:0.0007910119295473641,wikipedia_rel_freq:0.0019526501072748609},記:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.0008284951744899379,aozora_rel_freq:0.001219169031078612,news_rel_freq:0.0016920006427257152,twitter_rel_freq:0.0006651736657995587,wikipedia_rel_freq:0.0030518611660445933},初:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0027511099305581907,aozora_rel_freq:0.0012126227138249633,news_rel_freq:0.002166679556069581,twitter_rel_freq:0.001667381982399435,wikipedia_rel_freq:0.0017377907871574765},指:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.00025930001644341565,aozora_rel_freq:0.0005779213193272966,news_rel_freq:0.0020972899885003267,twitter_rel_freq:0.000570720004765662,wikipedia_rel_freq:0.0011056770661550803},権:{jlpt_level:3,joyo_grade:6,frequency:500,nhk_rel_freq:0.00028459757902326113,aozora_rel_freq:0.0003159715028126048,news_rel_freq:0.0016066204625182947,twitter_rel_freq:0.0002434805484429339,wikipedia_rel_freq:0.0011256754213445361},支:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.00028459757902326113,aozora_rel_freq:0.0006343517395701723,news_rel_freq:0.0014469081617443683,twitter_rel_freq:0.000326939603430557,wikipedia_rel_freq:0.0007521994465712031},産:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0015747732705953782,aozora_rel_freq:0.0004958106871873186,news_rel_freq:0.0012916538499483552,twitter_rel_freq:0.0004957567817228867,wikipedia_rel_freq:0.0010362525658071337},点:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.00038578782934264286,aozora_rel_freq:0.0010741010867158596,news_rel_freq:0.0023355016604070687,twitter_rel_freq:0.0018437954339600993,wikipedia_rel_freq:0.001383543313747313},報:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.0009992537219038946,aozora_rel_freq:0.0003322110316673532,news_rel_freq:0.002871332552991437,twitter_rel_freq:0.0015719288117249678,wikipedia_rel_freq:0.001233307104303007},済:{jlpt_level:3,joyo_grade:6,frequency:500,nhk_rel_freq:0.0006324390644961358,aozora_rel_freq:0.0003288893098561547,news_rel_freq:0.0007285904594771709,twitter_rel_freq:0.00020829780909485806,wikipedia_rel_freq:0.0004983095571350478},活:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.001555800098660494,aozora_rel_freq:0.0011708583752631104,news_rel_freq:0.0012013311167436832,twitter_rel_freq:0.001058280807435872,wikipedia_rel_freq:0.0011240962013267073},原:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.0029598148218419155,aozora_rel_freq:0.0010866498135581651,news_rel_freq:0.002052128621897991,twitter_rel_freq:0.0014078093287433185,wikipedia_rel_freq:0.0020898408632224123},共:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.000646181731283739,news_rel_freq:0.0024308638594128596,twitter_rel_freq:0.0003148455367796559,wikipedia_rel_freq:0.001277794203804446},得:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.0014364018674214965,news_rel_freq:0.0009617626655827939,twitter_rel_freq:0.0004119978738430926,wikipedia_rel_freq:0.0009257211850758131},解:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.0009750321905923943,news_rel_freq:0.0011177922798097486,twitter_rel_freq:0.0008168992292381358,wikipedia_rel_freq:0.0009198631582784428},交:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.0009296854248093196,aozora_rel_freq:0.0004843497756749962,news_rel_freq:0.0012640337008460682,twitter_rel_freq:0.0008567796638968922,wikipedia_rel_freq:0.0010822296638564677},資:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.00020870489128372482,aozora_rel_freq:0.0002472254590124199,news_rel_freq:0.0009008045119500271,twitter_rel_freq:0.0001564232587492576,wikipedia_rel_freq:0.0005801103499552451},予:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.00228310502283105,aozora_rel_freq:0.0003312397679798683,news_rel_freq:0.0020397237830029284,twitter_rel_freq:0.0013555349745414899,wikipedia_rel_freq:0.0005390799451175285},向:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0005755195486914836,aozora_rel_freq:0.001729742926315702,news_rel_freq:0.001559908491054076,twitter_rel_freq:0.0007680232078142463,wikipedia_rel_freq:0.0007835722645847957},際:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.0008221707838449766,aozora_rel_freq:0.0006268147333552891,news_rel_freq:0.0011650857280971732,twitter_rel_freq:0.00043718551678546504,wikipedia_rel_freq:0.0011152989643912307},勝:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0010372000657736626,aozora_rel_freq:0.0005331266380604905,news_rel_freq:0.004038550362773698,twitter_rel_freq:0.001697567173544659,wikipedia_rel_freq:0.0014639981369639371},面:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0006640610177209426,aozora_rel_freq:0.001946548406636093,news_rel_freq:0.0007550476549330458,twitter_rel_freq:0.001744843979543636,wikipedia_rel_freq:0.0013269029754484577},告:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0001201634222542658,aozora_rel_freq:0.0006250276081703167,news_rel_freq:0.0011750677468955438,twitter_rel_freq:0.00042379208760182254,wikipedia_rel_freq:0.00041546487311662446},反:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0005375732048217154,aozora_rel_freq:0.0006581865504610531,news_rel_freq:0.0011694468042712186,twitter_rel_freq:0.00048526193049689824,wikipedia_rel_freq:0.0005642658914874233},判:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.000423734173212411,aozora_rel_freq:0.000635400704352656,news_rel_freq:0.0016651557960543695,twitter_rel_freq:0.00022199109117067168,wikipedia_rel_freq:0.0006243884162985534},認:{jlpt_level:3,joyo_grade:6,frequency:500,nhk_rel_freq:0.00041740978256744963,aozora_rel_freq:0.0003772582414929053,news_rel_freq:0.001661763847919001,twitter_rel_freq:0.0004911590373762632,wikipedia_rel_freq:0.0007809058172262016},参:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.00046800490772714047,aozora_rel_freq:0.0004769487463763609,news_rel_freq:0.0009533312516463063,twitter_rel_freq:0.0006410854834618137,wikipedia_rel_freq:0.001333658315314877},利:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0011889854412527353,aozora_rel_freq:0.0008064790902662557,news_rel_freq:0.0011343643692711207,twitter_rel_freq:0.0004619733558716094,wikipedia_rel_freq:0.00234400861380779},組:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.00030989514160310655,aozora_rel_freq:0.0004502001444230253,news_rel_freq:0.0016806618446731974,twitter_rel_freq:0.000579615640566738,wikipedia_rel_freq:0.0018562539565659152},信:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.00043005856385737234,aozora_rel_freq:0.001218392020128624,news_rel_freq:0.0009772687142016216,twitter_rel_freq:0.0008991588726570745,wikipedia_rel_freq:0.0011780892111533828},在:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.000888045814741242,news_rel_freq:0.0009097204899058531,twitter_rel_freq:0.0007026552773209463,wikipedia_rel_freq:0.0020044457197563085},件:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.0007146561428806335,aozora_rel_freq:0.0004522009476192443,news_rel_freq:0.0012479461754040344,twitter_rel_freq:0.0005832138752727912,wikipedia_rel_freq:0.0008261462008523677},側:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.00033519270418295197,aozora_rel_freq:0.00048714701509495285,news_rel_freq:0.0010657501041328077,twitter_rel_freq:0.000211096436088455,wikipedia_rel_freq:0.0005359444477455681},任:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.00010751464096434309,aozora_rel_freq:0.0003051322000602727,news_rel_freq:0.000994713018897803,twitter_rel_freq:0.0002904575015497397,wikipedia_rel_freq:0.0008350657986608962},引:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.00041740978256744963,aozora_rel_freq:0.0013375077987617787,news_rel_freq:0.0012372857669785903,twitter_rel_freq:0.0009321426907958955,wikipedia_rel_freq:0.0007306766788383063},求:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00041789591417727576,news_rel_freq:0.0010615828535664978,twitter_rel_freq:0.0002842605417782036,wikipedia_rel_freq:0.00025302189199294194},所:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.007222454116545871,aozora_rel_freq:0.0022329352175279064,news_rel_freq:0.0020197597454061876,twitter_rel_freq:0.0013717270307187293,wikipedia_rel_freq:0.0028907565069699183},次:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0004490317357922564,aozora_rel_freq:0.0014176759035267866,news_rel_freq:0.0012654873929040832,twitter_rel_freq:0.001242590385157042,wikipedia_rel_freq:0.001147440361638682},昨:{jlpt_level:3,joyo_grade:4,frequency:500,aozora_rel_freq:0.00035394791299326646,news_rel_freq:0.0012814780055422493,twitter_rel_freq:0.001590519691039576,wikipedia_rel_freq:0.000014935674066924385},論:{jlpt_level:3,joyo_grade:6,frequency:500,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.0012304162645796878,news_rel_freq:0.0006220832880265975,twitter_rel_freq:0.00028186171864083483,wikipedia_rel_freq:0.0013101420850251727},官:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0004047610012775269,aozora_rel_freq:0.00043631107369199043,news_rel_freq:0.0011038368360528036,twitter_rel_freq:0.0001272375772446038,wikipedia_rel_freq:0.0006991509097333987},増:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.003269709963445022,aozora_rel_freq:0.0002379401781600637,news_rel_freq:0.0011766183517574265,twitter_rel_freq:0.00048336286217981456,wikipedia_rel_freq:0.00039240112313872747},係:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0007020073615907108,aozora_rel_freq:0.00046896495886523455,news_rel_freq:0.0008950866565218343,twitter_rel_freq:0.00046837021757125953,wikipedia_rel_freq:0.0005100816927966038},感:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.000689358580300788,aozora_rel_freq:0.002015041921877532,news_rel_freq:0.0011199243614948373,twitter_rel_freq:0.0029749404941935486,wikipedia_rel_freq:0.0003847369988714109},情:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.0006134658925612517,aozora_rel_freq:0.001282689676240128,news_rel_freq:0.001262580008788053,twitter_rel_freq:0.0008565797619687781,wikipedia_rel_freq:0.0008997093028128165},投:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0006767097990108653,aozora_rel_freq:0.0003495383758520848,news_rel_freq:0.0015556443276838984,twitter_rel_freq:0.0005283407960054797,wikipedia_rel_freq:0.0007300967392837364},示:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.0001517853754790726,aozora_rel_freq:0.00043868095708945375,news_rel_freq:0.001331485012337969,twitter_rel_freq:0.00019510428183932963,wikipedia_rel_freq:0.0006180881059287969},変:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0010182268938387787,aozora_rel_freq:0.0011855633074916326,news_rel_freq:0.0007533032244634278,twitter_rel_freq:0.0020627879962090596,wikipedia_rel_freq:0.0011239075616474186},打:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0004869780796620246,aozora_rel_freq:0.0007903366877802557,news_rel_freq:0.002250993695434457,twitter_rel_freq:0.0006869629759639921,wikipedia_rel_freq:0.0005030382950415411},直:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.0006197902832062131,aozora_rel_freq:0.001177288140874261,news_rel_freq:0.0008395556199056574,twitter_rel_freq:0.0008894636291435422,wikipedia_rel_freq:0.0008011399720147682},両:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0003921122199876042,aozora_rel_freq:0.0006744066540420518,news_rel_freq:0.0009997524846989219,twitter_rel_freq:0.0002737656905522151,wikipedia_rel_freq:0.0007462381777871952},式:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0010498488470635854,aozora_rel_freq:0.0007030977833703573,news_rel_freq:0.0011552006221026705,twitter_rel_freq:0.00038960885789431706,wikipedia_rel_freq:0.0020973839012091043},確:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.0003415170948279133,aozora_rel_freq:0.00041292304409735277,news_rel_freq:0.001174970834091676,twitter_rel_freq:0.001295864248999441,wikipedia_rel_freq:0.0006275392087796456},果:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0008727659090046674,aozora_rel_freq:0.0006818659591619362,news_rel_freq:0.0007767561229994048,twitter_rel_freq:0.0005506298609901983,wikipedia_rel_freq:0.0007270976233015318},容:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.00045535612643721776,aozora_rel_freq:0.0005231226220793955,news_rel_freq:0.001407561563374093,twitter_rel_freq:0.00036642023423308524,wikipedia_rel_freq:0.0006105527154966705},必:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.001625368395755069,aozora_rel_freq:0.000791871284406482,news_rel_freq:0.000595819918178458,twitter_rel_freq:0.0004975558990759133,wikipedia_rel_freq:0.0005628256020442056},演:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.00029724636031318384,aozora_rel_freq:0.0003410301059497166,news_rel_freq:0.0006980629262588537,twitter_rel_freq:0.0004837626660360427,wikipedia_rel_freq:0.0016150857741498974},歳:{jlpt_level:3,joyo_grade:9,frequency:500,nhk_rel_freq:0.002276780632186089,aozora_rel_freq:0.00037090617697675373,news_rel_freq:0.0010064394681657915,twitter_rel_freq:0.000636287837187076,wikipedia_rel_freq:0.0004903165880214036},争:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0007715756586852857,aozora_rel_freq:0.00038885512992147567,news_rel_freq:0.0005084045690898162,twitter_rel_freq:0.00015832232706634126,wikipedia_rel_freq:0.0004670922393976257},談:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.00036681465740775874,aozora_rel_freq:0.0004983553980485293,news_rel_freq:0.0007281058954578326,twitter_rel_freq:0.0002690679952415345,wikipedia_rel_freq:0.000261755399307037},能:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.0014609342389860737,aozora_rel_freq:0.0006178402568829282,news_rel_freq:0.0010758290357350457,twitter_rel_freq:0.000559025741970989,wikipedia_rel_freq:0.0012680677889892302},位:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.0006158200284129594,news_rel_freq:0.0030852191111273926,twitter_rel_freq:0.0010826688426657882,wikipedia_rel_freq:0.0018955177762989418},置:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0008601171277147447,aozora_rel_freq:0.0010364549061889427,news_rel_freq:0.0009603089735247788,twitter_rel_freq:0.0004205936567519975,wikipedia_rel_freq:0.0012738098278756865},流:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0009929293312589333,aozora_rel_freq:0.0010822208511432336,news_rel_freq:0.0010556711725305697,twitter_rel_freq:0.0008721721123616754,wikipedia_rel_freq:0.0008665278381444224},格:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.0002719487977333384,aozora_rel_freq:0.0005047463131121802,news_rel_freq:0.0007967201605961455,twitter_rel_freq:0.0006842642999344521,wikipedia_rel_freq:0.0007242744010743397},疑:{jlpt_level:3,joyo_grade:6,frequency:500,nhk_rel_freq:0.00032254392289302926,aozora_rel_freq:0.00039491581533138175,news_rel_freq:0.0013972888061641194,twitter_rel_freq:0.00010964620757056588,wikipedia_rel_freq:0.00014807577527947946},過:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.00018973171934884075,aozora_rel_freq:0.0009534701367302284,news_rel_freq:0.0009597274967015727,twitter_rel_freq:0.0012654791559261027,wikipedia_rel_freq:0.0006667036103033173},局:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0003604902667627974,aozora_rel_freq:0.00030025645634909826,news_rel_freq:0.0009221253288009153,twitter_rel_freq:0.0004559762980281874,wikipedia_rel_freq:0.0010809321287651443},放:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.00044270734514729505,aozora_rel_freq:0.0005112732050920791,news_rel_freq:0.0008066052665906483,twitter_rel_freq:0.0006285916129546845,wikipedia_rel_freq:0.0022917962096025086},常:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.0002403268445085316,aozora_rel_freq:0.0009895234448096697,news_rel_freq:0.000627607317847055,twitter_rel_freq:0.0004987553106445978,wikipedia_rel_freq:0.0007214065681121806},状:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.0002909219696682225,aozora_rel_freq:0.0003985483415225755,news_rel_freq:0.000839652532709525,twitter_rel_freq:0.00039030851464271626,wikipedia_rel_freq:0.0006601407338934697},球:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.001005578112548856,aozora_rel_freq:0.00015660655697007377,news_rel_freq:0.0013135561436224494,twitter_rel_freq:0.0006941594453760985,wikipedia_rel_freq:0.001017099265397194},職:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.0003731390480527201,aozora_rel_freq:0.0003341729843160728,news_rel_freq:0.0008461456905686591,twitter_rel_freq:0.00036672008712525635,wikipedia_rel_freq:0.0005252684615717706},与:{jlpt_level:3,joyo_grade:9,frequency:500,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.0005299797437130393,news_rel_freq:0.0006205326831647147,twitter_rel_freq:0.00010874664889405258,wikipedia_rel_freq:0.000383849882541783},供:{jlpt_level:3,joyo_grade:6,frequency:500,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.0009003808635723008,news_rel_freq:0.0005308883395871165,twitter_rel_freq:0.0003318372006693516,wikipedia_rel_freq:0.0004194670933393709},役:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0008158463932000151,aozora_rel_freq:0.0005711418987886516,news_rel_freq:0.0007458409385656168,twitter_rel_freq:0.0003371346017643744,wikipedia_rel_freq:0.0010698151336113882},構:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.0001201634222542658,aozora_rel_freq:0.000391866047352679,news_rel_freq:0.0005757589677778495,twitter_rel_freq:0.0006063025479699659,wikipedia_rel_freq:0.0006922719344014998},割:{jlpt_level:3,joyo_grade:6,frequency:500,nhk_rel_freq:0.0005628707674015608,aozora_rel_freq:0.0002534415466123236,news_rel_freq:0.0006277042306509226,twitter_rel_freq:0.0004411835553477464,wikipedia_rel_freq:0.0002996018722605432},費:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0003794634386976815,aozora_rel_freq:0.00017148631666234326,news_rel_freq:0.0006961246701815003,twitter_rel_freq:0.0001923056548457327,wikipedia_rel_freq:0.00019051078097244016},付:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.000689358580300788,aozora_rel_freq:0.000984550574729747,news_rel_freq:0.0014063986097276808,twitter_rel_freq:0.0015137573506437741,wikipedia_rel_freq:0.0011205426376384852},由:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0007209805335255948,aozora_rel_freq:0.000786509908851565,news_rel_freq:0.0005321482060373963,twitter_rel_freq:0.0004022026793655033,wikipedia_rel_freq:0.0008882417947414632},説:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.000600817111271329,aozora_rel_freq:0.0010861253311669232,news_rel_freq:0.0007456471129578815,twitter_rel_freq:0.0003535265598697279,wikipedia_rel_freq:0.0010614346883997456},難:{jlpt_level:3,joyo_grade:6,frequency:500,nhk_rel_freq:0.0022704562415411275,aozora_rel_freq:0.0006088075045893181,news_rel_freq:0.0008255032633448446,twitter_rel_freq:0.0005472315282122591,wikipedia_rel_freq:0.0002764004663004626},優:{jlpt_level:3,joyo_grade:6,frequency:500,nhk_rel_freq:0.0006134658925612517,aozora_rel_freq:0.000347071366085873,news_rel_freq:0.0013215029935395987,twitter_rel_freq:0.001156632556067993,wikipedia_rel_freq:0.0013658685405534199},夫:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0003035707509581452,aozora_rel_freq:0.0014038062580695016,news_rel_freq:0.00039966840315028637,twitter_rel_freq:0.0009725228802749371,wikipedia_rel_freq:0.0005616466040486513},収:{jlpt_level:3,joyo_grade:6,frequency:500,nhk_rel_freq:0.00014546098483411124,aozora_rel_freq:0.00015419782302511108,news_rel_freq:0.0006867241282063358,twitter_rel_freq:0.00021339530826176677,wikipedia_rel_freq:0.0008200090383133472},断:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.000507601828353386,news_rel_freq:0.0008471148186073358,twitter_rel_freq:0.00034533058081705117,wikipedia_rel_freq:0.0003778911629426303},石:{jlpt_level:3,joyo_grade:1,frequency:500,nhk_rel_freq:0.0012459049570573875,aozora_rel_freq:0.001001003781595742,news_rel_freq:0.0008182348030547691,twitter_rel_freq:0.0007292422337601173,wikipedia_rel_freq:0.0010355400686400907},違:{jlpt_level:3,joyo_grade:9,frequency:500,nhk_rel_freq:0.000689358580300788,aozora_rel_freq:0.0010252465232353663,news_rel_freq:0.0006274134922393196,twitter_rel_freq:0.001537445729125291,wikipedia_rel_freq:0.0003012741375255888},消:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0009676317686790878,aozora_rel_freq:0.0005372253708216771,news_rel_freq:0.0007166701846014471,twitter_rel_freq:0.0006127993606336731,wikipedia_rel_freq:0.00041417626017229434},神:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0010877951909333537,aozora_rel_freq:0.0017494790044453963,news_rel_freq:0.001184177550459105,twitter_rel_freq:0.002738456513234607,wikipedia_rel_freq:0.0019600707843885007},番:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.0016063952238201849,aozora_rel_freq:0.0006987465220504247,news_rel_freq:0.0008656251641460615,twitter_rel_freq:0.0016797759019425071,wikipedia_rel_freq:0.0021656638175570424},規:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.00018340732870387937,aozora_rel_freq:0.00016150172595499792,news_rel_freq:0.0011893139290640917,twitter_rel_freq:0.00016132085598805226,wikipedia_rel_freq:0.0004956889951038482},術:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.0011447147067380058,aozora_rel_freq:0.000740297182601031,news_rel_freq:0.0005084045690898162,twitter_rel_freq:0.00026257118257782733,wikipedia_rel_freq:0.0008909235372091889},備:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.0005944927206263677,aozora_rel_freq:0.00023710489138882666,news_rel_freq:0.0008101910403337522,twitter_rel_freq:0.00041789498072245754,wikipedia_rel_freq:0.0009116318403808325},宅:{jlpt_level:3,joyo_grade:6,frequency:500,nhk_rel_freq:0.00025930001644341565,aozora_rel_freq:0.00021488237821917094,news_rel_freq:0.0005910711907889419,twitter_rel_freq:0.0005137479552531528,wikipedia_rel_freq:0.00020064506536449648},害:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0014229878951163056,aozora_rel_freq:0.00022387627996528158,news_rel_freq:0.0013411762927247365,twitter_rel_freq:0.00024577942061624567,wikipedia_rel_freq:0.0004750762863642765},配:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0007526024867504016,aozora_rel_freq:0.0005719771855598886,news_rel_freq:0.0007747209541181837,twitter_rel_freq:0.0005185456015278905,wikipedia_rel_freq:0.0006872908271943365},警:{jlpt_level:3,joyo_grade:6,frequency:500,nhk_rel_freq:0.0024538635702450067,aozora_rel_freq:0.0003141066765326337,news_rel_freq:0.0017448181208335974,twitter_rel_freq:0.00024867799857389967,wikipedia_rel_freq:0.0004472646795934717},育:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0010688220189984696,aozora_rel_freq:0.0003267136791961884,news_rel_freq:0.0006082247570735202,twitter_rel_freq:0.0007678233058861322,wikipedia_rel_freq:0.0008559869587679534},席:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.00051227564224187,aozora_rel_freq:0.0002489348831023934,news_rel_freq:0.0006459238377780452,twitter_rel_freq:0.0003852110154758076,wikipedia_rel_freq:0.00025027896908869025},訪:{jlpt_level:3,joyo_grade:6,frequency:500,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00027997647055441247,news_rel_freq:0.0006067710650155051,twitter_rel_freq:0.0000856579761968778,wikipedia_rel_freq:0.0001525546930701581},乗:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0018403976776837552,aozora_rel_freq:0.0006019115324081748,news_rel_freq:0.0007719104828060211,twitter_rel_freq:0.0014029117315045238,wikipedia_rel_freq:0.0006378149729311684},残:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0009233610341643582,aozora_rel_freq:0.0007143644421451827,news_rel_freq:0.0005151884653605535,twitter_rel_freq:0.0007901123708708508,wikipedia_rel_freq:0.00038898649002511675},想:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.00014546098483411124,aozora_rel_freq:0.0010632423586897778,news_rel_freq:0.000665887875374786,twitter_rel_freq:0.0006555783732500835,wikipedia_rel_freq:0.00035866393617188833},声:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.00038578782934264286,aozora_rel_freq:0.0015962330198340203,news_rel_freq:0.0006467960530128544,twitter_rel_freq:0.000734339732927026,wikipedia_rel_freq:0.0006506539424546476},念:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0003731390480527201,aozora_rel_freq:0.0007647536022519021,news_rel_freq:0.0007059128633721352,twitter_rel_freq:0.0006110002432806465,wikipedia_rel_freq:0.0004880758545336366},助:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0007273049241705562,aozora_rel_freq:0.0009314030257505702,news_rel_freq:0.0003861975234126797,twitter_rel_freq:0.0003341360728426634,wikipedia_rel_freq:0.00044332618899210665},労:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0006514122364310199,aozora_rel_freq:0.00041577855933855855,news_rel_freq:0.0005588961399048743,twitter_rel_freq:0.00018271036229625747,wikipedia_rel_freq:0.00022782192510634335},例:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.0006243477235890773,news_rel_freq:0.0004939645613135329,twitter_rel_freq:0.00018380982290088483,wikipedia_rel_freq:0.0005014297593978768},然:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0004110853919224883,aozora_rel_freq:0.002128310693112027,news_rel_freq:0.00028221008486266585,twitter_rel_freq:0.0010410892416180622,wikipedia_rel_freq:0.000325646893926658},限:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0005372642213691764,news_rel_freq:0.0005859348121839553,twitter_rel_freq:0.0011591313301694188,wikipedia_rel_freq:0.0005991298181602841},追:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.0005343310050329718,news_rel_freq:0.0006015377736066507,twitter_rel_freq:0.0004527778671783623,wikipedia_rel_freq:0.0005032587995315204},商:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0004616805170821791,aozora_rel_freq:0.0003516363054170523,news_rel_freq:0.00043407244852331053,twitter_rel_freq:0.0002907573544419108,wikipedia_rel_freq:0.0005291470463290373},葉:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0005691951580465223,aozora_rel_freq:0.0015638899390407715,news_rel_freq:0.0005648078209408024,twitter_rel_freq:0.00145358687028144,wikipedia_rel_freq:0.0006850513682989971},伝:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0012142830038325808,aozora_rel_freq:0.0006890533104493248,news_rel_freq:0.000614814827736522,twitter_rel_freq:0.0004848621266406701,wikipedia_rel_freq:0.0007809376820368922},働:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0016506659583349144,aozora_rel_freq:0.0005049988416709263,news_rel_freq:0.0006413689359962646,twitter_rel_freq:0.00033463582766294855,wikipedia_rel_freq:0.000248342863191126},形:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.0008411439557798606,aozora_rel_freq:0.0012722583042365395,news_rel_freq:0.00046178951042946523,twitter_rel_freq:0.00035722474553983815,wikipedia_rel_freq:0.0013513318139163424},景:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.00022135367257364753,aozora_rel_freq:0.00040132615566878247,news_rel_freq:0.00037941362714194254,twitter_rel_freq:0.00020809790716674398,wikipedia_rel_freq:0.00023181267399724115},落:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0010877951909333537,aozora_rel_freq:0.0012616132542217044,news_rel_freq:0.0008731843628477401,twitter_rel_freq:0.000987115721027264,wikipedia_rel_freq:0.0005086324812063927},好:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0002529756257984543,aozora_rel_freq:0.0011400693163698375,news_rel_freq:0.0004620802488410682,twitter_rel_freq:0.003196032026687707,wikipedia_rel_freq:0.0003892809208758984},退:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.0003406416004747226,news_rel_freq:0.0007266522033998174,twitter_rel_freq:0.0002960547555369336,wikipedia_rel_freq:0.0005548453788548377},頭:{jlpt_level:3,joyo_grade:2,frequency:500,nhk_rel_freq:0.00044270734514729505,aozora_rel_freq:0.001433216122526546,news_rel_freq:0.0005194526287307311,twitter_rel_freq:0.0010261965479735641,wikipedia_rel_freq:0.0005066466662041511},負:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.00021502928192868617,aozora_rel_freq:0.00037473295590544444,news_rel_freq:0.0007038776944909141,twitter_rel_freq:0.0007373382618487371,wikipedia_rel_freq:0.0002567691937301631},渡:{jlpt_level:3,joyo_grade:9,frequency:500,nhk_rel_freq:0.00046800490772714047,aozora_rel_freq:0.0005622451234112894,news_rel_freq:0.0005334080724876761,twitter_rel_freq:0.0002594727026920593,wikipedia_rel_freq:0.00042139810086722464},失:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.00015810976612403395,aozora_rel_freq:0.0006383533459626103,news_rel_freq:0.0007082387706649594,twitter_rel_freq:0.0004113981680587504,wikipedia_rel_freq:0.0003579871275928188},差:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.00017075854741395666,aozora_rel_freq:0.00038963214087146364,news_rel_freq:0.0005473635162446211,twitter_rel_freq:0.00040210272840144625,wikipedia_rel_freq:0.00040591180287156574},末:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00040969844865490273,news_rel_freq:0.0006086124082889909,twitter_rel_freq:0.00038611057415232085,wikipedia_rel_freq:0.0003752973673524109},守:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0007083317522356721,aozora_rel_freq:0.0005298243415230416,news_rel_freq:0.0004896034851394875,twitter_rel_freq:0.00042529135206267806,wikipedia_rel_freq:0.000437827597259327},若:{jlpt_level:3,joyo_grade:6,frequency:500,nhk_rel_freq:0.0005249244235317927,aozora_rel_freq:0.0011105040497227955,news_rel_freq:0.00029732848226602293,twitter_rel_freq:0.00040180287550927514,wikipedia_rel_freq:0.00032913290421621573},種:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0005059512515969086,aozora_rel_freq:0.0007692214152143328,news_rel_freq:0.0006493157859134138,twitter_rel_freq:0.00031914342823410836,wikipedia_rel_freq:0.0009196337316414701},美:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0007273049241705562,aozora_rel_freq:0.00134646284996039,news_rel_freq:0.0007124060212312694,twitter_rel_freq:0.0019387488498142811,wikipedia_rel_freq:0.0013041986605351514},命:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0003415170948279133,aozora_rel_freq:0.0010356778952389548,news_rel_freq:0.0004897003979433553,twitter_rel_freq:0.00033843396429711586,wikipedia_rel_freq:0.0008534862084249507},福:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0011953098318976966,aozora_rel_freq:0.00037749134477790174,news_rel_freq:0.0013102611082909485,twitter_rel_freq:0.0014822727969658086,wikipedia_rel_freq:0.0009889396948936475},望:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.00017708293805891801,aozora_rel_freq:0.0005813013169597441,news_rel_freq:0.0003450095817689184,twitter_rel_freq:0.00044857992668796687,wikipedia_rel_freq:0.00027565610432272883},非:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.0006611197667972576,news_rel_freq:0.00040412639212819936,twitter_rel_freq:0.0004346867426840392,wikipedia_rel_freq:0.00035480447030103603},観:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0009486585967442036,aozora_rel_freq:0.0007262721349537482,news_rel_freq:0.0007246170345185963,twitter_rel_freq:0.0007518311516370069,wikipedia_rel_freq:0.0005501510549438902},察:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0019352635373581755,aozora_rel_freq:0.00037531571411793545,news_rel_freq:0.0006127796588553009,twitter_rel_freq:0.00024847809664578556,wikipedia_rel_freq:0.0003675006854726211},段:{jlpt_level:3,joyo_grade:6,frequency:500,nhk_rel_freq:0.0009233610341643582,aozora_rel_freq:0.0005488999603452462,news_rel_freq:0.0004113948524182749,twitter_rel_freq:0.0005367366769862705,wikipedia_rel_freq:0.0003470625958956342},横:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.00045535612643721776,aozora_rel_freq:0.0006717648168120927,news_rel_freq:0.0006058019369768284,twitter_rel_freq:0.0012123052430477608,wikipedia_rel_freq:0.0005504862727523558},深:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0001644341567689953,aozora_rel_freq:0.0008439115927819257,news_rel_freq:0.0005809922591867039,twitter_rel_freq:0.00048386261700009977,wikipedia_rel_freq:0.000312401329418766},申:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0001644341567689953,aozora_rel_freq:0.0008894832849987197,news_rel_freq:0.00041284854447629,twitter_rel_freq:0.00031164710592983084,wikipedia_rel_freq:0.000128611474317199},様:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0006324390644961358,aozora_rel_freq:0.002409802335018916,news_rel_freq:0.00043068050038794193,twitter_rel_freq:0.001992622419441022,wikipedia_rel_freq:0.0007861890028387123},財:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.00018973171934884075,aozora_rel_freq:0.00014842851672145047,news_rel_freq:0.0004411470832056507,twitter_rel_freq:0.00016661825708307504,wikipedia_rel_freq:0.0003129697976414873},港:{jlpt_level:3,joyo_grade:3,frequency:500,nhk_rel_freq:0.0019162903654232914,aozora_rel_freq:0.00009143476353983344,news_rel_freq:0.0006070618034271081,twitter_rel_freq:0.0007718213444484136,wikipedia_rel_freq:0.0006167153698842435},識:{jlpt_level:3,joyo_grade:5,frequency:500,nhk_rel_freq:0.00008854146902945901,aozora_rel_freq:0.000678913317551982,news_rel_freq:0.0004073245146558326,twitter_rel_freq:0.00027756382718638236,wikipedia_rel_freq:0.00023808621792601755},呼:{jlpt_level:3,joyo_grade:6,frequency:500,nhk_rel_freq:0.0004047610012775269,aozora_rel_freq:0.0007899870328527611,news_rel_freq:0.00046556910978030446,twitter_rel_freq:0.0009890147893443476,wikipedia_rel_freq:0.0006655309852699012},達:{jlpt_level:3,joyo_grade:4,frequency:500,nhk_rel_freq:0.0001960561099938021,aozora_rel_freq:0.0011769384859467663,news_rel_freq:0.0005442623065208556,twitter_rel_freq:0.002047995253528619,wikipedia_rel_freq:0.0005737909206990742},良:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00020238050063876346,aozora_rel_freq:0.0005853029233521821,news_rel_freq:0.0006067710650155051,twitter_rel_freq:0.0028787876667706823,wikipedia_rel_freq:0.0006816392843702417},候:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0002719487977333384,aozora_rel_freq:0.0003636411245943663,news_rel_freq:0.0004938676485096652,twitter_rel_freq:0.00008345905498762307,wikipedia_rel_freq:0.00022501144880342748},程:{jlpt_level:3,joyo_grade:5,frequency:1000,aozora_rel_freq:0.0006955802024292237,news_rel_freq:0.0003509212628048465,twitter_rel_freq:0.0002741654944084432,wikipedia_rel_freq:0.0004122031910943289},満:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.0004495202598417858,news_rel_freq:0.0003863913490204151,twitter_rel_freq:0.0005455323618232895,wikipedia_rel_freq:0.00035028858932995623},敗:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.0001724575803498282,news_rel_freq:0.0010242714240774435,twitter_rel_freq:0.00019870251654538284,wikipedia_rel_freq:0.00042724720551760154},値:{jlpt_level:3,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0008664415183597061,aozora_rel_freq:0.00024372890973747404,news_rel_freq:0.0008326748108310525,twitter_rel_freq:0.00045257796525024823,wikipedia_rel_freq:0.00021928088124881985},突:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00009486585967442038,aozora_rel_freq:0.0007454448801447012,news_rel_freq:0.00045277661966977155,twitter_rel_freq:0.00033523553344729076,wikipedia_rel_freq:0.00024042636962313932},光:{jlpt_level:3,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0014356366764062282,aozora_rel_freq:0.0011468487369084824,news_rel_freq:0.0006651125729438446,twitter_rel_freq:0.0005138479062172099,wikipedia_rel_freq:0.0008614702553916015},路:{jlpt_level:3,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0007273049241705562,aozora_rel_freq:0.0006267758828077896,news_rel_freq:0.0005709133275844658,twitter_rel_freq:0.0005208444737012022,wikipedia_rel_freq:0.0011463123473402328},科:{jlpt_level:3,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0005186000328868313,aozora_rel_freq:0.0005009972352784883,news_rel_freq:0.0004787492511063081,twitter_rel_freq:0.00039380679838471247,wikipedia_rel_freq:0.001330898822709066},積:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00022135367257364753,aozora_rel_freq:0.0002807340562306507,news_rel_freq:0.00026747933867477946,twitter_rel_freq:0.00013653301690190792,wikipedia_rel_freq:0.0003772615142833829},他:{jlpt_level:3,joyo_grade:3,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0010637862663547693,news_rel_freq:0.0002919013652494332,twitter_rel_freq:0.00047216835420542684,wikipedia_rel_freq:0.0010537068345110477},処:{jlpt_level:3,joyo_grade:6,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0010872519970444058,news_rel_freq:0.0004437637289100779,twitter_rel_freq:0.0002387828531322533,wikipedia_rel_freq:0.00040950360433261653},太:{jlpt_level:3,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0008664415183597061,aozora_rel_freq:0.0012720057756777934,news_rel_freq:0.0007036838688831788,twitter_rel_freq:0.0007577282585163719,wikipedia_rel_freq:0.0010368184848449998},客:{jlpt_level:3,joyo_grade:3,frequency:1000,nhk_rel_freq:0.001625368395755069,aozora_rel_freq:0.0006224440467616067,news_rel_freq:0.0006818784880129522,twitter_rel_freq:0.00039190773006762884,wikipedia_rel_freq:0.0004528206279854946},否:{jlpt_level:3,joyo_grade:6,frequency:1000,aozora_rel_freq:0.00023557029476260042,news_rel_freq:0.0003203937295865293,twitter_rel_freq:0.00009785199381183591,wikipedia_rel_freq:0.00012564422314568512},師:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00020870489128372482,aozora_rel_freq:0.000695560777155474,news_rel_freq:0.0003119623156500417,twitter_rel_freq:0.00027396559248032916,wikipedia_rel_freq:0.0006335119488955021},登:{jlpt_level:3,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0007526024867504016,aozora_rel_freq:0.0003062005901165062,news_rel_freq:0.0006182067758718905,twitter_rel_freq:0.0003855108683679787,wikipedia_rel_freq:0.0009965948970139706},易:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0002403268445085316,aozora_rel_freq:0.0002933799094417048,news_rel_freq:0.00011600462622960543,twitter_rel_freq:0.0000463772473224636,wikipedia_rel_freq:0.00016249778859807047},速:{jlpt_level:3,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0007526024867504016,aozora_rel_freq:0.00023118018289516843,news_rel_freq:0.0013787784606253937,twitter_rel_freq:0.0007332402723223986,wikipedia_rel_freq:0.0005653148810553597},存:{jlpt_level:3,joyo_grade:6,frequency:1000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.0006953859496917267,news_rel_freq:0.0002991698255395087,twitter_rel_freq:0.00031174705689388784,wikipedia_rel_freq:0.0012370735249266427},飛:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0032950075260248673,aozora_rel_freq:0.0008987879911248255,news_rel_freq:0.0005492048595181069,twitter_rel_freq:0.0005753177491122855,wikipedia_rel_freq:0.0004067683289829306},殺:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00038578782934264286,aozora_rel_freq:0.0007035834152140998,news_rel_freq:0.0007494267123087208,twitter_rel_freq:0.00037681513449501676,wikipedia_rel_freq:0.0004679449417317076},号:{jlpt_level:3,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0008284951744899379,aozora_rel_freq:0.00048415552293749924,news_rel_freq:0.0008178471518392984,twitter_rel_freq:0.0004165956181897161,wikipedia_rel_freq:0.0025165119529627264},単:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0002403268445085316,aozora_rel_freq:0.0004108251145323853,news_rel_freq:0.00021863528552547187,twitter_rel_freq:0.000523343247802628,wikipedia_rel_freq:0.0005285722051441778},座:{jlpt_level:3,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00038578782934264286,aozora_rel_freq:0.0007359653465548481,news_rel_freq:0.00029054458599528577,twitter_rel_freq:0.0005218439833417725,wikipedia_rel_freq:0.0006325356110959404},破:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.0003921768517326742,news_rel_freq:0.0004459927233990344,twitter_rel_freq:0.0002469788321849301,wikipedia_rel_freq:0.00032759192197121564},除:{jlpt_level:3,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0002403268445085316,aozora_rel_freq:0.00017109781118734927,news_rel_freq:0.0004622740744488036,twitter_rel_freq:0.0002737656905522151,wikipedia_rel_freq:0.002565019116980899},完:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00021078364545798443,news_rel_freq:0.0003309572252081057,twitter_rel_freq:0.0006769678795582887,wikipedia_rel_freq:0.000418191226319317},降:{jlpt_level:3,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0008221707838449766,aozora_rel_freq:0.000494625745488587,news_rel_freq:0.0005532751972805492,twitter_rel_freq:0.0010883660476170391,wikipedia_rel_freq:0.0006232170658575649},責:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.00017492459011603998,news_rel_freq:0.00026844846671345615,twitter_rel_freq:0.00009415380814172566,wikipedia_rel_freq:0.00010110449513659694},捕:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0004743292983721018,aozora_rel_freq:0.00021309525303419863,news_rel_freq:0.0006049297217420193,twitter_rel_freq:0.00015092595572612077,wikipedia_rel_freq:0.00019521147784552577},危:{jlpt_level:3,joyo_grade:6,frequency:1000,nhk_rel_freq:0.001132065925448083,aozora_rel_freq:0.00025307246641107927,news_rel_freq:0.0003312479636197087,twitter_rel_freq:0.0002666691721041657,wikipedia_rel_freq:0.00015307727596548486},給:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00032254392289302926,aozora_rel_freq:0.00032282862444624855,news_rel_freq:0.0003139005717273951,twitter_rel_freq:0.0003044506365177244,wikipedia_rel_freq:0.00022388853287468876},苦:{jlpt_level:3,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.000954266572953966,news_rel_freq:0.0002049705801801299,twitter_rel_freq:0.000410198756490066,wikipedia_rel_freq:0.00011325391015673035},迎:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00018973171934884075,aozora_rel_freq:0.00021884513406410954,news_rel_freq:0.0003331862196970622,twitter_rel_freq:0.00028186171864083483,wikipedia_rel_freq:0.0001184516980765902},園:{jlpt_level:3,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0013217976447969237,aozora_rel_freq:0.00026764142172335355,news_rel_freq:0.0006550336413416066,twitter_rel_freq:0.0009563308240976977,wikipedia_rel_freq:0.0009607457103945548},具:{jlpt_level:3,joyo_grade:3,frequency:1000,nhk_rel_freq:0.000423734173212411,aozora_rel_freq:0.00040717316306744186,news_rel_freq:0.00023830858471060964,twitter_rel_freq:0.00021359521018988084,wikipedia_rel_freq:0.00023131430835803929},辞:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00019194112992077636,news_rel_freq:0.0002038076265337178,twitter_rel_freq:0.00021149623994468314,wikipedia_rel_freq:0.000204254711119534},因:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.000847468346424822,aozora_rel_freq:0.00028648393726056167,news_rel_freq:0.0003309572252081057,twitter_rel_freq:0.000115943118306159,wikipedia_rel_freq:0.00019469399331990952},馬:{jlpt_level:3,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0003415170948279133,aozora_rel_freq:0.0012804557697589124,news_rel_freq:0.0005668429898220235,twitter_rel_freq:0.0007301417924366305,wikipedia_rel_freq:0.0009769496039269672},愛:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00025930001644341565,aozora_rel_freq:0.001056579489793631,news_rel_freq:0.0005175143726533776,twitter_rel_freq:0.0030546014125470045,wikipedia_rel_freq:0.000961535957699683},富:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0006956829709457493,aozora_rel_freq:0.000331064940516121,news_rel_freq:0.0004917355668245764,twitter_rel_freq:0.00044378228041322924,wikipedia_rel_freq:0.0005051592168411112},彼:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.005374953821267978,news_rel_freq:0.00006774204990350393,twitter_rel_freq:0.0007626258557551666,wikipedia_rel_freq:0.0006273913560580408},未:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00010751464096434309,aozora_rel_freq:0.00038308582361781503,news_rel_freq:0.0004261255986061613,twitter_rel_freq:0.00032903857367575466,wikipedia_rel_freq:0.0004204102917358143},舞:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0002529756257984543,aozora_rel_freq:0.0004902550588949047,news_rel_freq:0.0002611800064233806,twitter_rel_freq:0.0002859597081671732,wikipedia_rel_freq:0.0003824988145684992},亡:{jlpt_level:3,joyo_grade:6,frequency:1000,nhk_rel_freq:0.002814353837007804,aozora_rel_freq:0.00024736143592866776,news_rel_freq:0.0007146350157202259,twitter_rel_freq:0.00009505336681823898,wikipedia_rel_freq:0.00025006866133813193},冷:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00017708293805891801,aozora_rel_freq:0.0004045701763849822,news_rel_freq:0.00011658610305281147,twitter_rel_freq:0.00040839963913703935,wikipedia_rel_freq:0.00013015882952433728},適:{jlpt_level:3,joyo_grade:5,frequency:1000,aozora_rel_freq:0.0001681645948511447,news_rel_freq:0.0003767969814375154,twitter_rel_freq:0.000267568730780679,wikipedia_rel_freq:0.00022473231306177732},婦:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.0006525143705261409,news_rel_freq:0.00017017888359163502,twitter_rel_freq:0.00010714743346914004,wikipedia_rel_freq:0.0001228949272792953},寄:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0005375732048217154,aozora_rel_freq:0.0006788744670044825,news_rel_freq:0.0003524718676667293,twitter_rel_freq:0.0003029513720568689,wikipedia_rel_freq:0.0002345836379349006},込:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00018340732870387937,aozora_rel_freq:0.0011662934359319313,news_rel_freq:0.0012844823024621473,twitter_rel_freq:0.0008358899124089722,wikipedia_rel_freq:0.00046041464966929175},顔:{jlpt_level:3,joyo_grade:2,frequency:1000,nhk_rel_freq:0.00032254392289302926,aozora_rel_freq:0.0019366609422974963,news_rel_freq:0.00029761922067762596,twitter_rel_freq:0.0013592331602116001,wikipedia_rel_freq:0.00014867100994318092},類:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0005944927206263677,aozora_rel_freq:0.0005288919283830562,news_rel_freq:0.0002542022845449081,twitter_rel_freq:0.00017291516781866816,wikipedia_rel_freq:0.0007099772978136561},余:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.0008001658762976034,news_rel_freq:0.0001481796771136731,twitter_rel_freq:0.00044408213330540035,wikipedia_rel_freq:0.0001229382634218346},王:{jlpt_level:3,joyo_grade:1,frequency:1000,nhk_rel_freq:0.0006134658925612517,aozora_rel_freq:0.0006102644001205454,news_rel_freq:0.0005994056919215618,twitter_rel_freq:0.0005928091678222664,wikipedia_rel_freq:0.0013361119057380575},返:{jlpt_level:3,joyo_grade:3,frequency:1000,nhk_rel_freq:0.00020870489128372482,aozora_rel_freq:0.0010132999798793015,news_rel_freq:0.0004911540900013703,twitter_rel_freq:0.00083529020662463,wikipedia_rel_freq:0.00021545455478108586},妻:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0001201634222542658,aozora_rel_freq:0.0005280954921593185,news_rel_freq:0.00027436014774938426,twitter_rel_freq:0.00007026552773209463,wikipedia_rel_freq:0.00023161511217095908},背:{jlpt_level:3,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00008854146902945901,aozora_rel_freq:0.0005028814868322091,news_rel_freq:0.0002439295273349347,twitter_rel_freq:0.00020140119257492276,wikipedia_rel_freq:0.0002616534319128269},熱:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0011383903160930445,aozora_rel_freq:0.00046710013258526343,news_rel_freq:0.0003306664867965027,twitter_rel_freq:0.0005363368731300424,wikipedia_rel_freq:0.00022338889264305925},宿:{jlpt_level:3,joyo_grade:3,frequency:1000,nhk_rel_freq:0.00033519270418295197,aozora_rel_freq:0.0005174698674182331,news_rel_freq:0.00025265167968302536,twitter_rel_freq:0.0011080563875362746,wikipedia_rel_freq:0.0002563269101577768},薬:{jlpt_level:3,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0005249244235317927,aozora_rel_freq:0.00023531776620385435,news_rel_freq:0.00033008500997329664,twitter_rel_freq:0.00024158148012585025,wikipedia_rel_freq:0.0003076203332227399},険:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0011700122693178512,aozora_rel_freq:0.0001687473530636357,news_rel_freq:0.0003304726611887673,twitter_rel_freq:0.00014662806427166833,wikipedia_rel_freq:0.0002230460272800278},頼:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.0004831065581550155,news_rel_freq:0.00016581780741758973,twitter_rel_freq:0.000407300178532412,wikipedia_rel_freq:0.002197974735597368},覚:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0001201634222542658,aozora_rel_freq:0.0007885301373215337,news_rel_freq:0.00023675797984872688,twitter_rel_freq:0.0008607777024591736,wikipedia_rel_freq:0.00019051333015729542},船:{jlpt_level:3,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0016633147396248372,aozora_rel_freq:0.0007281758117812187,news_rel_freq:0.00048049368157592625,twitter_rel_freq:0.00028945799190916935,wikipedia_rel_freq:0.000536449186346908},途:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00025930001644341565,aozora_rel_freq:0.0004005685699925442,news_rel_freq:0.00021698776785972142,twitter_rel_freq:0.0003017519604881845,wikipedia_rel_freq:0.00019027753055818458},許:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00022135367257364753,aozora_rel_freq:0.0004416530239731577,news_rel_freq:0.00028065948000078304,twitter_rel_freq:0.0003941066512768836,wikipedia_rel_freq:0.0002226228625940559},抜:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00042170326783221674,news_rel_freq:0.0002867649866444465,twitter_rel_freq:0.0005107494263314418,wikipedia_rel_freq:0.0002161262649904449},便:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00038578782934264286,aozora_rel_freq:0.0002520817774498446,news_rel_freq:0.00019004600838450815,twitter_rel_freq:0.00026057216329668665,wikipedia_rel_freq:0.00048812173986103116},留:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.00034790665285711005,news_rel_freq:0.0002189260239370749,twitter_rel_freq:0.00021369516115393787,wikipedia_rel_freq:0.0003147669729644403},罪:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.00033557160402605113,news_rel_freq:0.00047089931399302656,twitter_rel_freq:0.00012823708688517414,wikipedia_rel_freq:0.00018566732974746044},努:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.00015755839538380902,news_rel_freq:0.00011765214389535588,twitter_rel_freq:0.00009565307260258117,wikipedia_rel_freq:0.000041581028766451115},精:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.0005300768700817877,news_rel_freq:0.00020797487710002776,twitter_rel_freq:0.00026477010378708207,wikipedia_rel_freq:0.0002645544042781042},散:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00039687776798010135,news_rel_freq:0.00018859231632649303,twitter_rel_freq:0.0005702202499453768,wikipedia_rel_freq:0.0001852683823176134},静:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00027827318837829977,aozora_rel_freq:0.0004913817247723872,news_rel_freq:0.00025856336071895347,twitter_rel_freq:0.0005006543789616814,wikipedia_rel_freq:0.0003055746123763998},婚:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00011383903160930444,aozora_rel_freq:0.00029839163006912714,news_rel_freq:0.00016930666835682597,twitter_rel_freq:0.0003098479885768042,wikipedia_rel_freq:0.0002503057355296704},喜:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0002403268445085316,aozora_rel_freq:0.00043658302752448626,news_rel_freq:0.00024199127125758125,twitter_rel_freq:0.0002797627483956371,wikipedia_rel_freq:0.00020707283497701566},浮:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.0004832813856187628,news_rel_freq:0.0002281327403045039,twitter_rel_freq:0.00018350997000871373,wikipedia_rel_freq:0.00009806841597399121},絶:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.0005354382456367047,news_rel_freq:0.00017676895425463684,twitter_rel_freq:0.001510558919793949,wikipedia_rel_freq:0.0002228025801263512},幸:{jlpt_level:3,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0001960561099938021,aozora_rel_freq:0.0005684612110111931,news_rel_freq:0.0001876231882878163,twitter_rel_freq:0.0009046561756802113,wikipedia_rel_freq:0.00032352979590437076},押:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00018973171934884075,aozora_rel_freq:0.0004912651731298891,news_rel_freq:0.0002657349082051613,twitter_rel_freq:0.00023938255891659552,wikipedia_rel_freq:0.00011814961967124277},倒:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0003794634386976815,aozora_rel_freq:0.0003189241444225591,news_rel_freq:0.0002490659059399214,twitter_rel_freq:0.00028086220900026446,wikipedia_rel_freq:0.00018051032878528463},等:{jlpt_level:3,joyo_grade:3,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0012983270216086356,news_rel_freq:0.00016097216722420603,twitter_rel_freq:0.00023448496167780087,wikipedia_rel_freq:0.0014448792505495434},老:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.0007884718615002846,news_rel_freq:0.00011803979511082657,twitter_rel_freq:0.00020150114353897978,wikipedia_rel_freq:0.0001838357404289615},曲:{jlpt_level:3,joyo_grade:3,frequency:1000,nhk_rel_freq:0.00018340732870387937,aozora_rel_freq:0.0004310662497795717,news_rel_freq:0.00014575685701698126,twitter_rel_freq:0.0006713706255710948,wikipedia_rel_freq:0.0018995148981519776},払:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0006640610177209426,aozora_rel_freq:0.0002628239538334282,news_rel_freq:0.0002384054975144773,twitter_rel_freq:0.00021699354296782,wikipedia_rel_freq:0.00009362008840157561},庭:{jlpt_level:3,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0003478414854728747,aozora_rel_freq:0.0005102048150358457,news_rel_freq:0.00012957241877107974,twitter_rel_freq:0.0001441292901702425,wikipedia_rel_freq:0.00016283683018381907},徒:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0002529756257984543,aozora_rel_freq:0.0002464678733361816,news_rel_freq:0.0002514887260366133,twitter_rel_freq:0.00012653792049620457,wikipedia_rel_freq:0.00023861517378348244},勤:{jlpt_level:3,joyo_grade:6,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00018623009943836483,news_rel_freq:0.0001379069199036997,twitter_rel_freq:0.0005900105408286695,wikipedia_rel_freq:0.00013717163706113692},遅:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0004110853919224883,aozora_rel_freq:0.000141746222551554,news_rel_freq:0.00022183340805310511,twitter_rel_freq:0.000897659608196219,wikipedia_rel_freq:0.0001025588050965185},居:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00013913659418914989,aozora_rel_freq:0.002522255244755924,news_rel_freq:0.00022357783852272324,twitter_rel_freq:0.0006060026950777948,wikipedia_rel_freq:0.00030005562716477815},雑:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00015810976612403395,aozora_rel_freq:0.00044256601183939354,news_rel_freq:0.00008315118571846404,twitter_rel_freq:0.0002345849126418579,wikipedia_rel_freq:0.0002834668067192225},招:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00011925175554940249,news_rel_freq:0.00017667204145076917,twitter_rel_freq:0.00006406856796055855,wikipedia_rel_freq:0.00008717447449506966},困:{jlpt_level:3,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00025930001644341565,aozora_rel_freq:0.0004319403870983082,news_rel_freq:0.00012433912736222537,twitter_rel_freq:0.0002292875115468351,wikipedia_rel_freq:0.000087647348285719},欠:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00018434584788464402,news_rel_freq:0.00020293541129890873,twitter_rel_freq:0.00012783728302894599,wikipedia_rel_freq:0.00011854729250866216},更:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.00043199866291955725,news_rel_freq:0.00034103615681034375,twitter_rel_freq:0.0004910590864122061,wikipedia_rel_freq:0.000600405685180338},刻:{jlpt_level:3,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00039711087126509777,news_rel_freq:0.00014517538019377522,twitter_rel_freq:0.00030644965579886506,wikipedia_rel_freq:0.00013421840640632688},賛:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00014546098483411124,aozora_rel_freq:0.00006526891979898882,news_rel_freq:0.00019702373026298065,twitter_rel_freq:0.00007026552773209463,wikipedia_rel_freq:0.0001259832647314337},抱:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.0003987231689863228,news_rel_freq:0.00015166853805290934,twitter_rel_freq:0.00014223022185315884,wikipedia_rel_freq:0.0000972960129628497},犯:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00020238050063876346,aozora_rel_freq:0.00019256273868076672,news_rel_freq:0.00029471183656159573,twitter_rel_freq:0.00017011654082507122,wikipedia_rel_freq:0.00016150233191209438},恐:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00013913659418914989,aozora_rel_freq:0.0007045741041753344,news_rel_freq:0.0002137896453320882,twitter_rel_freq:0.0001956040366596148,wikipedia_rel_freq:0.00011908134673583756},息:{jlpt_level:3,joyo_grade:3,frequency:1000,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.0005907225747283483,news_rel_freq:0.00014401242654736313,twitter_rel_freq:0.0002214913363503865,wikipedia_rel_freq:0.0001860293139969063},遠:{jlpt_level:3,joyo_grade:2,frequency:1000,nhk_rel_freq:0.00035416587611783603,aozora_rel_freq:0.0008172795424710883,news_rel_freq:0.00021039769719671963,twitter_rel_freq:0.0005618243689645859,wikipedia_rel_freq:0.000285374871583379},戻:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0003162195322480679,aozora_rel_freq:0.0002773734838719528,news_rel_freq:0.00021989515197575165,twitter_rel_freq:0.0005044525155958486,wikipedia_rel_freq:0.00019346273703482256},願:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00024665123515349294,aozora_rel_freq:0.00034880021544959623,news_rel_freq:0.00017560600060822476,twitter_rel_freq:0.0015572360200085838,wikipedia_rel_freq:0.00017949447862046652},絵:{jlpt_level:3,joyo_grade:2,frequency:1000,nhk_rel_freq:0.00102455128448374,aozora_rel_freq:0.0004062990257487054,news_rel_freq:0.00011697375426828217,twitter_rel_freq:0.0002464790773646449,wikipedia_rel_freq:0.0002590787552090219},越:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00029724636031318384,aozora_rel_freq:0.000491401150046137,news_rel_freq:0.00039424128613369663,twitter_rel_freq:0.0008426865779648504,wikipedia_rel_freq:0.00037686129226110825},欲:{jlpt_level:3,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.000260512346257214,news_rel_freq:0.00014062047841199456,twitter_rel_freq:0.001099560555591427,wikipedia_rel_freq:0.00006421906487352092},痛:{jlpt_level:3,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0001517853754790726,aozora_rel_freq:0.0003929732879564119,news_rel_freq:0.00018054855360547612,twitter_rel_freq:0.001495266422293223,wikipedia_rel_freq:0.0000658008340762051},笑:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.0013269987256631915,news_rel_freq:0.00024741838827417096,twitter_rel_freq:0.02915489660772425,wikipedia_rel_freq:0.00021956256617532526},互:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00023469615744386397,news_rel_freq:0.00006948648037312205,twitter_rel_freq:0.0002731659847678729,wikipedia_rel_freq:0.00011698974056210288},束:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.0002733524522057651,news_rel_freq:0.0002060366210226743,twitter_rel_freq:0.00014163051606881663,wikipedia_rel_freq:0.0001007284903704472},似:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00020870489128372482,aozora_rel_freq:0.0004621272625053405,news_rel_freq:0.00005795385671286888,twitter_rel_freq:0.0005790159347823958,wikipedia_rel_freq:0.00017272511823734348},列:{jlpt_level:3,joyo_grade:3,frequency:1000,nhk_rel_freq:0.00038578782934264286,aozora_rel_freq:0.00023710489138882666,news_rel_freq:0.00025197329005595165,twitter_rel_freq:0.00017641345156066434,wikipedia_rel_freq:0.0006272473271137191},探:{jlpt_level:3,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00018973171934884075,aozora_rel_freq:0.0003717803142954902,news_rel_freq:0.00012879711634013836,twitter_rel_freq:0.0003571247945757811,wikipedia_rel_freq:0.000223249962068448},逃:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0007905488306201697,aozora_rel_freq:0.0004378068197707173,news_rel_freq:0.0002568189302493353,twitter_rel_freq:0.0002657696134276524,wikipedia_rel_freq:0.00012878736807221143},遊:{jlpt_level:3,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0003478414854728747,aozora_rel_freq:0.0005174310168707337,news_rel_freq:0.0001441093393512308,twitter_rel_freq:0.0012659789107463879,wikipedia_rel_freq:0.00020995851223316148},迷:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.00023780420124381582,news_rel_freq:0.00010767012509698548,twitter_rel_freq:0.0004474804660833395,wikipedia_rel_freq:0.00007630092649499014},夢:{jlpt_level:3,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.0005568254720351234,news_rel_freq:0.00010078931602238065,twitter_rel_freq:0.000653979157825171,wikipedia_rel_freq:0.00019719984203262273},君:{jlpt_level:3,joyo_grade:3,frequency:1000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.0019242093418239392,news_rel_freq:0.00009584676302512929,twitter_rel_freq:0.0007834156562790295,wikipedia_rel_freq:0.00021254466026881513},閉:{jlpt_level:3,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00013913659418914989,aozora_rel_freq:0.00019794353950943337,news_rel_freq:0.00015796787030430815,twitter_rel_freq:0.0001531248769353755,wikipedia_rel_freq:0.00019021252634437562},緒:{jlpt_level:3,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0012522293477023488,aozora_rel_freq:0.00038683490145150694,news_rel_freq:0.00014062047841199456,twitter_rel_freq:0.0017696318186297803,wikipedia_rel_freq:0.0001168444370253535},折:{jlpt_level:3,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00013913659418914989,aozora_rel_freq:0.0005193541189719539,news_rel_freq:0.0001404266528042592,twitter_rel_freq:0.00017801266698557687,wikipedia_rel_freq:0.00012795633380939913},草:{jlpt_level:3,joyo_grade:1,frequency:1000,nhk_rel_freq:0.00028459757902326113,aozora_rel_freq:0.0008668916916278196,news_rel_freq:0.00011765214389535588,twitter_rel_freq:0.0003256402408978155,wikipedia_rel_freq:0.0002554270479038727},暮:{jlpt_level:3,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.0004349513045295115,news_rel_freq:0.00010960838117433896,twitter_rel_freq:0.0001477275248762957,wikipedia_rel_freq:0.00008344501705183527},酒:{jlpt_level:3,joyo_grade:3,frequency:1500,nhk_rel_freq:0.0004363829545023337,aozora_rel_freq:0.0006446277093837631,news_rel_freq:0.00022454696656139998,twitter_rel_freq:0.000597506863132947,wikipedia_rel_freq:0.00017638447309705846},悲:{jlpt_level:3,joyo_grade:3,frequency:1500,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.000542586746376594,news_rel_freq:0.00006909882915765135,twitter_rel_freq:0.00030485044037395254,wikipedia_rel_freq:0.00006214785217862827},晴:{jlpt_level:3,joyo_grade:2,frequency:1500,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00027321647528951717,news_rel_freq:0.0003607094559954815,twitter_rel_freq:0.0007339399290707979,wikipedia_rel_freq:0.0001375935271546812},掛:{jlpt_level:3,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.0005495215691052365,news_rel_freq:0.0002881217658985939,twitter_rel_freq:0.0002158940823631926,wikipedia_rel_freq:0.00015581510050002604},到:{jlpt_level:3,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.00022743110506147653,news_rel_freq:0.0001434309497241571,twitter_rel_freq:0.0002282880019062648,wikipedia_rel_freq:0.00008757852029462719},寝:{jlpt_level:3,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0002909219696682225,aozora_rel_freq:0.000644957939037508,news_rel_freq:0.00008004997599469848,twitter_rel_freq:0.0035228716791542067,wikipedia_rel_freq:0.000058143082771026594},暗:{jlpt_level:3,joyo_grade:3,frequency:1500,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.0006155869251279631,news_rel_freq:0.00005766311830126586,twitter_rel_freq:0.0001474276719841246,wikipedia_rel_freq:0.00013235750146199256},盗:{jlpt_level:3,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0002403268445085316,aozora_rel_freq:0.00015693678662381864,news_rel_freq:0.00018713862426847792,twitter_rel_freq:0.00009505336681823898,wikipedia_rel_freq:0.00009363155973342424},吸:{jlpt_level:3,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00017075854741395666,aozora_rel_freq:0.00022224455697030687,news_rel_freq:0.00007879010954441873,twitter_rel_freq:0.00017021649178912824,wikipedia_rel_freq:0.00011587319759550229},陽:{jlpt_level:3,joyo_grade:3,frequency:1500,nhk_rel_freq:0.0004996268609519473,aozora_rel_freq:0.0003190989718863064,news_rel_freq:0.00017589673901982777,twitter_rel_freq:0.0002476784889333293,wikipedia_rel_freq:0.0003859529600473663},御:{jlpt_level:3,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00023400245386357023,aozora_rel_freq:0.002373127418179484,news_rel_freq:0.0002522640284675547,twitter_rel_freq:0.0004317881647263852,wikipedia_rel_freq:0.0004381730118072137},歯:{jlpt_level:3,joyo_grade:3,frequency:1500,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.00016762068718615314,news_rel_freq:0.0000755919870167855,twitter_rel_freq:0.00025397539966892245,wikipedia_rel_freq:0.00010611619256202336},忘:{jlpt_level:3,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00010751464096434309,aozora_rel_freq:0.0004991324089985172,news_rel_freq:0.00006270258410238489,twitter_rel_freq:0.0008260947179313828,wikipedia_rel_freq:0.00004727845691794045},雪:{jlpt_level:3,joyo_grade:2,frequency:1500,nhk_rel_freq:0.0009676317686790878,aozora_rel_freq:0.0006211037028728775,news_rel_freq:0.00032746836426886944,twitter_rel_freq:0.00009195488693247093,wikipedia_rel_freq:0.00017895787520843585},吹:{jlpt_level:3,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00009486585967442038,aozora_rel_freq:0.0004327950991432949,news_rel_freq:0.00019401943334308277,twitter_rel_freq:0.00024368045037104796,wikipedia_rel_freq:0.00017086803707029206},娘:{jlpt_level:3,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.0006800982592507135,news_rel_freq:0.00006473775298360604,twitter_rel_freq:0.0001828103132603145,wikipedia_rel_freq:0.00021472676250491128},誤:{jlpt_level:3,joyo_grade:6,frequency:1500,aozora_rel_freq:0.00017954780526846834,news_rel_freq:0.0001309291980252272,twitter_rel_freq:0.00010514841418799937,wikipedia_rel_freq:0.00010684908320790845},洗:{jlpt_level:3,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00014546098483411124,aozora_rel_freq:0.00020623813140055485,news_rel_freq:0.000050782309226661024,twitter_rel_freq:0.00034652999238573553,wikipedia_rel_freq:0.0000671021929448115},慣:{jlpt_level:3,joyo_grade:5,frequency:1500,nhk_rel_freq:0.00011383903160930444,aozora_rel_freq:0.0001703985013323601,news_rel_freq:0.000039831162389613894,twitter_rel_freq:0.00015092595572612077,wikipedia_rel_freq:0.00005031326148811855},礼:{jlpt_level:3,joyo_grade:3,frequency:1500,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.0003555407854407418,news_rel_freq:0.00008702769787317099,twitter_rel_freq:0.00020120129064680868,wikipedia_rel_freq:0.00012934181577822887},窓:{jlpt_level:3,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00018973171934884075,aozora_rel_freq:0.0004390888878381974,news_rel_freq:0.00007656111505546223,twitter_rel_freq:0.00013063591002254293,wikipedia_rel_freq:0.00009059165679353564},昔:{jlpt_level:3,joyo_grade:3,frequency:1500,nhk_rel_freq:0.0006387634551410971,aozora_rel_freq:0.0004480827895843081,news_rel_freq:0.000021417729654755888,twitter_rel_freq:0.0002666691721041657,wikipedia_rel_freq:0.00004129424547023521},貧:{jlpt_level:3,joyo_grade:5,frequency:1500,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.0002236820272277846,news_rel_freq:0.00003595465023490694,twitter_rel_freq:0.00007406366436626191,wikipedia_rel_freq:0.00004506321527872603},怒:{jlpt_level:3,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00010751464096434309,aozora_rel_freq:0.0002774123344194522,news_rel_freq:0.00004390150015205619,twitter_rel_freq:0.0004075000804605261,wikipedia_rel_freq:0.00007067360092702025},泳:{jlpt_level:3,joyo_grade:3,frequency:1500,nhk_rel_freq:0.00022135367257364753,aozora_rel_freq:0.00006707547025771083,news_rel_freq:0.0001655270690059867,twitter_rel_freq:0.00007336400761786268,wikipedia_rel_freq:0.00005775178289574534},祖:{jlpt_level:3,joyo_grade:5,frequency:1500,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.0003036364539815459,news_rel_freq:0.000056306339047118423,twitter_rel_freq:0.000045677590574064366,wikipedia_rel_freq:0.00014914388373383027},杯:{jlpt_level:3,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.00022317697011029242,news_rel_freq:0.0005442623065208556,twitter_rel_freq:0.0003665201851971423,wikipedia_rel_freq:0.00014213617456674114},疲:{jlpt_level:3,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.0001931649221670074,news_rel_freq:0.00003876512154706948,twitter_rel_freq:0.0018542902851860876,wikipedia_rel_freq:0.000019675883305266404},皆:{jlpt_level:3,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.0007973103610563976,news_rel_freq:0.000073362992527829,twitter_rel_freq:0.0006426846988867262,wikipedia_rel_freq:0.00006825314990695801},鳴:{jlpt_level:3,joyo_grade:2,frequency:1500,nhk_rel_freq:0.00022767806321860888,aozora_rel_freq:0.0004917119544261321,news_rel_freq:0.00007026178280406344,twitter_rel_freq:0.00018061139205105976,wikipedia_rel_freq:0.00008862623527013596},腹:{jlpt_level:3,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00045072462681426716,news_rel_freq:0.00006425318896426766,twitter_rel_freq:0.0011558329483555368,wikipedia_rel_freq:0.00006587985880671793},煙:{jlpt_level:3,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00022135367257364753,aozora_rel_freq:0.00037498548446419054,news_rel_freq:0.0000969128038676737,twitter_rel_freq:0.00011574321637804494,wikipedia_rel_freq:0.000056121579180811364},眠:{jlpt_level:3,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.0003400394169884819,news_rel_freq:0.00003411330696142114,twitter_rel_freq:0.0012245992116267758,wikipedia_rel_freq:0.00006365187124322724},怖:{jlpt_level:3,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00014546098483411124,aozora_rel_freq:0.00027049693696455933,news_rel_freq:0.00004176941846696737,twitter_rel_freq:0.0007795175686808052,wikipedia_rel_freq:0.000049292312953589924},耳:{jlpt_level:3,joyo_grade:1,frequency:1500,nhk_rel_freq:0.00009486585967442038,aozora_rel_freq:0.0004658957656127821,news_rel_freq:0.00003634230145037764,twitter_rel_freq:0.00018680835182259583,wikipedia_rel_freq:0.000053970067162978256},頂:{jlpt_level:3,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.00023743512104257153,news_rel_freq:0.00007549507421291782,twitter_rel_freq:0.00039380679838471247,wikipedia_rel_freq:0.0000947659469940116},箱:{jlpt_level:3,joyo_grade:3,frequency:1500,nhk_rel_freq:0.0004047610012775269,aozora_rel_freq:0.00021496007931416972,news_rel_freq:0.00010980220678207431,twitter_rel_freq:0.00017341492263895332,wikipedia_rel_freq:0.0000900996641164719},晩:{jlpt_level:3,joyo_grade:6,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.0004575817484479109,news_rel_freq:0.000023355985732109364,twitter_rel_freq:0.0002405819704852799,wikipedia_rel_freq:0.00004309269538561585},寒:{jlpt_level:3,joyo_grade:3,frequency:1500,nhk_rel_freq:0.00020238050063876346,aozora_rel_freq:0.00031121231074392853,news_rel_freq:0.00007055252121566646,twitter_rel_freq:0.0004468807602989973,wikipedia_rel_freq:0.00005393182939014947},髪:{jlpt_level:3,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.0003427006794921907,news_rel_freq:0.0000320781380802,twitter_rel_freq:0.0008779692682769833,wikipedia_rel_freq:0.0000947659469940116},忙:{jlpt_level:3,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00010413889257213663,news_rel_freq:0.000016572089461372202,twitter_rel_freq:0.0002211914834582154,wikipedia_rel_freq:0.000010415969318561705},才:{jlpt_level:3,joyo_grade:2,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00020169261734312528,news_rel_freq:0.00003421021976528882,twitter_rel_freq:0.00013813223232682047,wikipedia_rel_freq:0.00010868959467340075},靴:{jlpt_level:3,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.00013481139982291144,news_rel_freq:0.000020254776008343805,twitter_rel_freq:0.0001554237491086873,wikipedia_rel_freq:0.00003238611899355536},恥:{jlpt_level:3,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00019848744717442494,news_rel_freq:0.000014440007776283382,twitter_rel_freq:0.00025377549774080834,wikipedia_rel_freq:0.00001974980966606873},偶:{jlpt_level:3,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.0001476320804977128,news_rel_freq:0.000021514642458623564,twitter_rel_freq:0.00005007543299257384,wikipedia_rel_freq:0.00009327849763097177},偉:{jlpt_level:3,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00012410807398682724,news_rel_freq:0.0000744290333703734,twitter_rel_freq:0.00007326405665380564,wikipedia_rel_freq:0.000026825072231822033},猫:{jlpt_level:3,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00014546098483411124,aozora_rel_freq:0.00016818402012489441,news_rel_freq:0.000038571295939334135,twitter_rel_freq:0.00030574999905046585,wikipedia_rel_freq:0.00007442345184909667},幾:{jlpt_level:3,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0005352245676254581,news_rel_freq:0.000006299332251398791,twitter_rel_freq:0.000017191565817809783,wikipedia_rel_freq:0.00005570606204940521},党:{jlpt_level:2,joyo_grade:6,frequency:500,nhk_rel_freq:0.00044270734514729505,aozora_rel_freq:0.00018009171293345994,news_rel_freq:0.001754412488416497,twitter_rel_freq:0.00017491418709980884,wikipedia_rel_freq:0.0007066608083169725},協:{jlpt_level:2,joyo_grade:4,frequency:500,nhk_rel_freq:0.0007209805335255948,aozora_rel_freq:0.00009875809174346999,news_rel_freq:0.0012915569371444876,twitter_rel_freq:0.0001733149716748963,wikipedia_rel_freq:0.0007239340848961634},総:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.0007336293148155175,aozora_rel_freq:0.00021985524829909388,news_rel_freq:0.0011135281164395708,twitter_rel_freq:0.0006045034306169393,wikipedia_rel_freq:0.0010337977007915256},区:{jlpt_level:2,joyo_grade:3,frequency:500,nhk_rel_freq:0.0009676317686790878,aozora_rel_freq:0.00020658778632804943,news_rel_freq:0.001573573196399418,twitter_rel_freq:0.0032478066260692505,wikipedia_rel_freq:0.0019964094145001254},領:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.001062497628353508,aozora_rel_freq:0.00023935822314379176,news_rel_freq:0.0007204497839522863,twitter_rel_freq:0.00007006562580398056,wikipedia_rel_freq:0.0005195672096429983},県:{jlpt_level:2,joyo_grade:3,frequency:500,nhk_rel_freq:0.006577366270759812,aozora_rel_freq:0.00010598429357835804,news_rel_freq:0.003839103812414026,twitter_rel_freq:0.005819345029328612,wikipedia_rel_freq:0.004018699428243201},設:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.00045535612643721776,aozora_rel_freq:0.00016532850488368864,news_rel_freq:0.0015916958907226729,twitter_rel_freq:0.0002276882961219226,wikipedia_rel_freq:0.0020599389248703004},改:{jlpt_level:2,joyo_grade:4,frequency:500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.0004049781071337259,news_rel_freq:0.0010244652496851788,twitter_rel_freq:0.0002981537257821313,wikipedia_rel_freq:0.0009360657772184277},府:{jlpt_level:2,joyo_grade:4,frequency:500,nhk_rel_freq:0.0023020781947659342,aozora_rel_freq:0.00027049693696455933,news_rel_freq:0.0017191362278086639,twitter_rel_freq:0.0012949646903229275,wikipedia_rel_freq:0.0009133882287461015},査:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.0009676317686790878,aozora_rel_freq:0.00017441953299854782,news_rel_freq:0.0017049869584439836,twitter_rel_freq:0.00030934823375651906,wikipedia_rel_freq:0.0004991686324312679},委:{jlpt_level:2,joyo_grade:3,frequency:500,nhk_rel_freq:0.00025930001644341565,aozora_rel_freq:0.00008504384847618245,news_rel_freq:0.0011106207323235407,twitter_rel_freq:0.00007456341918654708,wikipedia_rel_freq:0.00042243561910331243},軍:{jlpt_level:2,joyo_grade:4,frequency:500,nhk_rel_freq:0.0008537927370697833,aozora_rel_freq:0.0006678214862409037,news_rel_freq:0.0008792898694914036,twitter_rel_freq:0.0001864085479663677,wikipedia_rel_freq:0.0016571294799675768},団:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.0007020073615907108,aozora_rel_freq:0.00036634123764557445,news_rel_freq:0.0012672318233737014,twitter_rel_freq:0.0005195451111684608,wikipedia_rel_freq:0.0011506026254516227},各:{jlpt_level:2,joyo_grade:4,frequency:500,aozora_rel_freq:0.0002486823545436473,news_rel_freq:0.0008475024698228066,twitter_rel_freq:0.00011764228469512857,wikipedia_rel_freq:0.0006497081948733488},島:{jlpt_level:2,joyo_grade:3,frequency:500,nhk_rel_freq:0.0030104099470016064,aozora_rel_freq:0.0007570223432995218,news_rel_freq:0.0027037703151042286,twitter_rel_freq:0.001807613184971453,wikipedia_rel_freq:0.002397296774021988},革:{jlpt_level:2,joyo_grade:6,frequency:500,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.0001619096567037416,news_rel_freq:0.0002967470054428169,twitter_rel_freq:0.00005347376577051299,wikipedia_rel_freq:0.0003053464603318547},村:{jlpt_level:2,joyo_grade:1,frequency:500,nhk_rel_freq:0.0007083317522356721,aozora_rel_freq:0.0011662157348369324,news_rel_freq:0.0011971638661773733,twitter_rel_freq:0.0005606249573959016,wikipedia_rel_freq:0.002313728121504673},勢:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.0013470952073767692,aozora_rel_freq:0.0005843122343909475,news_rel_freq:0.0009677712594225896,twitter_rel_freq:0.00036701994001742745,wikipedia_rel_freq:0.00036766383330335726},減:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.0005628707674015608,aozora_rel_freq:0.0001786736679497319,news_rel_freq:0.0008099003019221492,twitter_rel_freq:0.0004029023361139025,wikipedia_rel_freq:0.00019453594385888387},再:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.000334289535958571,news_rel_freq:0.0012155772989122314,twitter_rel_freq:0.00035462602047435526,wikipedia_rel_freq:0.0008166836266696704},税:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.0006197902832062131,aozora_rel_freq:0.00008121706954749174,news_rel_freq:0.0006663724393941244,twitter_rel_freq:0.0001998019771500102,wikipedia_rel_freq:0.0001253281242236338},営:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.00022135367257364753,aozora_rel_freq:0.00012830393311676224,news_rel_freq:0.0008339346772813323,twitter_rel_freq:0.0003681194006220548,wikipedia_rel_freq:0.0007950066332530308},比:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.0004490317357922564,aozora_rel_freq:0.0003770445634816586,news_rel_freq:0.0009137908276682954,twitter_rel_freq:0.0002937558833636218,wikipedia_rel_freq:0.0004101319783994362},防:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.0005059512515969086,aozora_rel_freq:0.0001476515057714625,news_rel_freq:0.001018456655845383,twitter_rel_freq:0.00018001168626671755,wikipedia_rel_freq:0.0005090403507832332},補:{jlpt_level:2,joyo_grade:6,frequency:500,nhk_rel_freq:0.00015810976612403395,aozora_rel_freq:0.00008978361527110902,news_rel_freq:0.0006432102792697504,twitter_rel_freq:0.0001519254653666911,wikipedia_rel_freq:0.00039990974712987375},境:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.00039843661063256557,aozora_rel_freq:0.0002891257744905207,news_rel_freq:0.0003925937684679462,twitter_rel_freq:0.00015162561247452,wikipedia_rel_freq:0.00037189165638579354},導:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00015285747913638186,news_rel_freq:0.0005571517094352562,twitter_rel_freq:0.00013153546869905624,wikipedia_rel_freq:0.00040555236780697514},副:{jlpt_level:2,joyo_grade:4,frequency:500,nhk_rel_freq:0.00015810976612403395,aozora_rel_freq:0.00003752962888441857,news_rel_freq:0.0003446219305534477,twitter_rel_freq:0.00006366876410433041,wikipedia_rel_freq:0.0002134661905939889},算:{jlpt_level:2,joyo_grade:2,frequency:500,nhk_rel_freq:0.0001960561099938021,aozora_rel_freq:0.0001518473649013975,news_rel_freq:0.0007256830753611407,twitter_rel_freq:0.00010574811997234157,wikipedia_rel_freq:0.0003299002088576468},輸:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.0006956829709457493,aozora_rel_freq:0.0000493013447767362,news_rel_freq:0.00034568797139599214,twitter_rel_freq:0.00003638215091676024,wikipedia_rel_freq:0.00022709540742259639},述:{jlpt_level:2,joyo_grade:5,frequency:500,aozora_rel_freq:0.00026538808996838845,news_rel_freq:0.0007360527453749818,twitter_rel_freq:0.000022988721733117732,wikipedia_rel_freq:0.00041375437007875004},線:{jlpt_level:2,joyo_grade:2,frequency:500,nhk_rel_freq:0.0018846684121984847,aozora_rel_freq:0.0005019296484184739,news_rel_freq:0.0010722432619919419,twitter_rel_freq:0.0011889167174584149,wikipedia_rel_freq:0.0027817495387820385},農:{jlpt_level:2,joyo_grade:3,frequency:500,nhk_rel_freq:0.00046800490772714047,aozora_rel_freq:0.00024302959988248485,news_rel_freq:0.00032708071305339876,twitter_rel_freq:0.00008805679933424662,wikipedia_rel_freq:0.0002984458169286862},州:{jlpt_level:2,joyo_grade:3,frequency:500,nhk_rel_freq:0.0007968732212651311,aozora_rel_freq:0.0003506456164558176,news_rel_freq:0.0011309724211357522,twitter_rel_freq:0.00024148152916179323,wikipedia_rel_freq:0.0015387402369199403},武:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.00017075854741395666,aozora_rel_freq:0.0006359640372913973,news_rel_freq:0.0006018285120182537,twitter_rel_freq:0.0005556274091930499,wikipedia_rel_freq:0.0009131868431425366},象:{jlpt_level:2,joyo_grade:4,frequency:500,nhk_rel_freq:0.0008601171277147447,aozora_rel_freq:0.00048497138443498656,news_rel_freq:0.0013775185941751142,twitter_rel_freq:0.0009386395034596027,wikipedia_rel_freq:0.00038494348284468633},域:{jlpt_level:2,joyo_grade:6,frequency:500,nhk_rel_freq:0.00008854146902945901,aozora_rel_freq:0.00007641902693131608,news_rel_freq:0.0008444981729029086,twitter_rel_freq:0.00010334929683497276,wikipedia_rel_freq:0.0008720595692803204},額:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.00019829319443692795,news_rel_freq:0.0005131532964793323,twitter_rel_freq:0.00012164032325740992,wikipedia_rel_freq:0.00013100515889628113},欧:{jlpt_level:2,joyo_grade:9,frequency:500,aozora_rel_freq:0.00007167926013638951,news_rel_freq:0.00045219514284656554,twitter_rel_freq:0.000024388035229916204,wikipedia_rel_freq:0.00015732166874948028},担:{jlpt_level:2,joyo_grade:6,frequency:500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00008595683634241831,news_rel_freq:0.0006153963045597281,twitter_rel_freq:0.0001849092835055122,wikipedia_rel_freq:0.00042654872886726234},準:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.000600817111271329,aozora_rel_freq:0.0005966278579482568,news_rel_freq:0.0008560307965631618,twitter_rel_freq:0.0003225417610120475,wikipedia_rel_freq:0.0004912942004133929},賞:{jlpt_level:2,joyo_grade:4,frequency:500,nhk_rel_freq:0.0007905488306201697,aozora_rel_freq:0.00011779486001817506,news_rel_freq:0.0007178331382478592,twitter_rel_freq:0.00015322482789943253,wikipedia_rel_freq:0.0012495199199824129},辺:{jlpt_level:2,joyo_grade:4,frequency:500,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.0003996944326738077,news_rel_freq:0.0006137487868939776,twitter_rel_freq:0.00031854372244976615,wikipedia_rel_freq:0.0004117456124128111},造:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.0005124969973383101,news_rel_freq:0.00040412639212819936,twitter_rel_freq:0.0001751140890279229,wikipedia_rel_freq:0.0008860686146523604},被:{jlpt_level:2,joyo_grade:9,frequency:500,nhk_rel_freq:0.0008031976119100924,aozora_rel_freq:0.00019582618467071616,news_rel_freq:0.0010149677949061466,twitter_rel_freq:0.00016941688407667198,wikipedia_rel_freq:0.00022538362979229433},技:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.0012269317851225034,aozora_rel_freq:0.00023745454631632124,news_rel_freq:0.0005630633904711843,twitter_rel_freq:0.0005123486417563544,wikipedia_rel_freq:0.0010181316852635714},低:{jlpt_level:2,joyo_grade:4,frequency:500,nhk_rel_freq:0.00035416587611783603,aozora_rel_freq:0.00028168589464438597,news_rel_freq:0.0004832072400842211,twitter_rel_freq:0.000811601828143113,wikipedia_rel_freq:0.0002658723328482698},復:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.00018340732870387937,aozora_rel_freq:0.00022836351820146208,news_rel_freq:0.000835485282143215,twitter_rel_freq:0.00033583523923163297,wikipedia_rel_freq:0.0006209814307395085},移:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.00038578782934264286,aozora_rel_freq:0.0002848716395393366,news_rel_freq:0.0006420473256233383,twitter_rel_freq:0.00022908760961872106,wikipedia_rel_freq:0.0007877809687808176},個:{jlpt_level:2,joyo_grade:5,frequency:500,nhk_rel_freq:0.0003035707509581452,aozora_rel_freq:0.000336678844629784,news_rel_freq:0.0004551994397664634,twitter_rel_freq:0.0005659223584909244,wikipedia_rel_freq:0.0003993298075753038},門:{jlpt_level:2,joyo_grade:2,frequency:500,nhk_rel_freq:0.0008411439557798606,aozora_rel_freq:0.001151258274049664,news_rel_freq:0.0004480278922802555,twitter_rel_freq:0.0003868102309007201,wikipedia_rel_freq:0.0008742888314362386},課:{jlpt_level:2,joyo_grade:4,frequency:500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00010615912104210533,news_rel_freq:0.00037282355647894077,twitter_rel_freq:0.000315145389671827,wikipedia_rel_freq:0.0002961196857482683},脳:{jlpt_level:2,joyo_grade:6,frequency:500,nhk_rel_freq:0.0001960561099938021,aozora_rel_freq:0.0000987969422909694,news_rel_freq:0.00029509948777706646,twitter_rel_freq:0.00014522875077486986,wikipedia_rel_freq:0.00010120136416109654},極:{jlpt_level:2,joyo_grade:4,frequency:500,nhk_rel_freq:0.00014546098483411124,aozora_rel_freq:0.0005538339798776698,news_rel_freq:0.0003062444602218489,twitter_rel_freq:0.0009809187612557278,wikipedia_rel_freq:0.00029569014810015826},含:{jlpt_level:2,joyo_grade:9,frequency:500,aozora_rel_freq:0.0001516531121639005,news_rel_freq:0.00046130494641012686,twitter_rel_freq:0.0000784615067847714,wikipedia_rel_freq:0.0003899539056776851},蔵:{jlpt_level:2,joyo_grade:6,frequency:500,nhk_rel_freq:0.00010751464096434309,aozora_rel_freq:0.0005531540952964303,news_rel_freq:0.00014546611860537822,twitter_rel_freq:0.00029235656986682334,wikipedia_rel_freq:0.00037599074563303956},量:{jlpt_level:2,joyo_grade:4,frequency:500,nhk_rel_freq:0.00028459757902326113,aozora_rel_freq:0.00022879087422395544,news_rel_freq:0.0005908773651812066,twitter_rel_freq:0.0003663202832690282,wikipedia_rel_freq:0.0004975027401283603},型:{jlpt_level:2,joyo_grade:4,frequency:500,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.0001765174625635153,news_rel_freq:0.0005385444510926627,twitter_rel_freq:0.0003234413196885608,wikipedia_rel_freq:0.0010625843707694645},況:{jlpt_level:2,joyo_grade:9,frequency:500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00004698973720052201,news_rel_freq:0.0004869868394350604,twitter_rel_freq:0.0001641194829816492,wikipedia_rel_freq:0.00020370663637565473},針:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00014440748505526276,news_rel_freq:0.000591943406023751,twitter_rel_freq:0.000047676609855205035,wikipedia_rel_freq:0.0001341992875199125},専:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0006767097990108653,aozora_rel_freq:0.00014862276945894746,news_rel_freq:0.0003479169658849486,twitter_rel_freq:0.00023318559914505942,wikipedia_rel_freq:0.0005052815777141634},谷:{jlpt_level:2,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0005438975954666768,aozora_rel_freq:0.00049443149275109,news_rel_freq:0.0007599902079302972,twitter_rel_freq:0.0013432410059624749,wikipedia_rel_freq:0.000857765015204492},史:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.000265624407088377,aozora_rel_freq:0.0005238802077556338,news_rel_freq:0.00040897203232158303,twitter_rel_freq:0.00018440952868522701,wikipedia_rel_freq:0.0012107034821914832},階:{jlpt_level:2,joyo_grade:3,frequency:1000,nhk_rel_freq:0.00036681465740775874,aozora_rel_freq:0.0005667517869212196,news_rel_freq:0.0003865851746281504,twitter_rel_freq:0.0003942066022409406,wikipedia_rel_freq:0.00031956708804688075},管:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00022135367257364753,aozora_rel_freq:0.00012614772773054565,news_rel_freq:0.0004858238857886483,twitter_rel_freq:0.0001266378714602616,wikipedia_rel_freq:0.0006469856654479393},兵:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.000531248814176754,aozora_rel_freq:0.0008785274306038894,news_rel_freq:0.00039831162389613895,twitter_rel_freq:0.0004254912539907921,wikipedia_rel_freq:0.0007526786933239907},接:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.0003057149582727637,news_rel_freq:0.0003574144206639806,twitter_rel_freq:0.0002812620128564926,wikipedia_rel_freq:0.0004622972226848957},細:{jlpt_level:2,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0005944927206263677,aozora_rel_freq:0.0006306609375577295,news_rel_freq:0.0003406485055948731,twitter_rel_freq:0.0002787632387550668,wikipedia_rel_freq:0.0003879298529026146},効:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00011344359869824248,news_rel_freq:0.0003240764161335009,twitter_rel_freq:0.00019290536063007487,wikipedia_rel_freq:0.0002656734964295601},丸:{jlpt_level:2,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.0003877673145914925,news_rel_freq:0.0001931472181082737,twitter_rel_freq:0.0003973050821267086,wikipedia_rel_freq:0.00035570815633222304},湾:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0005944927206263677,aozora_rel_freq:0.000035587101509448664,news_rel_freq:0.0002314277756360048,twitter_rel_freq:0.0000793610654612847,wikipedia_rel_freq:0.0002395303311465181},録:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00044270734514729505,aozora_rel_freq:0.00016785379047114954,news_rel_freq:0.0005694596355264507,twitter_rel_freq:0.0003593237157850359,wikipedia_rel_freq:0.0010509932272326312},省:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0019921830531628277,aozora_rel_freq:0.0001827724007109184,news_rel_freq:0.0011081979122268487,twitter_rel_freq:0.00015152566151046295,wikipedia_rel_freq:0.00050544982391461},旧:{jlpt_level:2,joyo_grade:5,frequency:1000,aozora_rel_freq:0.0001829472281746657,news_rel_freq:0.00017851338472425497,twitter_rel_freq:0.00006866631230718209,wikipedia_rel_freq:0.0006504130444858262},橋:{jlpt_level:2,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0003162195322480679,aozora_rel_freq:0.0004275891257783756,news_rel_freq:0.0006168499966177431,twitter_rel_freq:0.0009554312654211843,wikipedia_rel_freq:0.0008815884222692542},岸:{jlpt_level:2,joyo_grade:3,frequency:1000,nhk_rel_freq:0.00032254392289302926,aozora_rel_freq:0.00042113993489347547,news_rel_freq:0.0002611800064233806,twitter_rel_freq:0.00014093085932041742,wikipedia_rel_freq:0.00026774980749416324},周:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0011700122693178512,aozora_rel_freq:0.0002976340443928889,news_rel_freq:0.0005238137049047764,twitter_rel_freq:0.0004864613420655826,wikipedia_rel_freq:0.0005428387181865984},材:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00021502928192868617,aozora_rel_freq:0.00015839368215504607,news_rel_freq:0.00053699384623078,twitter_rel_freq:0.00016371967912542107,wikipedia_rel_freq:0.00028429019342746906},戸:{jlpt_level:2,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0004363829545023337,aozora_rel_freq:0.0009698650677749743,news_rel_freq:0.0006506725651675612,twitter_rel_freq:0.0008952607850588501,wikipedia_rel_freq:0.0008875191008349991},央:{jlpt_level:2,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0003162195322480679,aozora_rel_freq:0.00010950026812705356,news_rel_freq:0.00041488371335751114,twitter_rel_freq:0.00040799983528081124,wikipedia_rel_freq:0.000522975469794471},券:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00013913659418914989,aozora_rel_freq:0.00002177573187341264,news_rel_freq:0.00020351688812211477,twitter_rel_freq:0.0001415305651047596,wikipedia_rel_freq:0.0001463295836536315},編:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00016169597869249491,news_rel_freq:0.00020409836494532084,twitter_rel_freq:0.00017531399095603698,wikipedia_rel_freq:0.0017267821323600685},捜:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00009372694584229793,news_rel_freq:0.0006348757781371305,twitter_rel_freq:0.00001969033991923562,wikipedia_rel_freq:0.00011600320602312016},竹:{jlpt_level:2,joyo_grade:1,frequency:1000,nhk_rel_freq:0.00010751464096434309,aozora_rel_freq:0.000307696336195233,news_rel_freq:0.00019566695100883323,twitter_rel_freq:0.00014812732873252383,wikipedia_rel_freq:0.0003008127350667881},超:{jlpt_level:2,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00010415831784588633,news_rel_freq:0.0004551994397664634,twitter_rel_freq:0.000683964447042281,wikipedia_rel_freq:0.0003008790138730247},並:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0003162195322480679,aozora_rel_freq:0.00042314073808969447,news_rel_freq:0.0002941303597383897,twitter_rel_freq:0.0003069494106191502,wikipedia_rel_freq:0.00018975877144014069},療:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.000055536857650389596,news_rel_freq:0.0004183725742967474,twitter_rel_freq:0.00009165503404029982,wikipedia_rel_freq:0.00026739547079928315},採:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.00009485361171978048,news_rel_freq:0.0002836637769206809,twitter_rel_freq:0.00008096028088619723,wikipedia_rel_freq:0.00024972069760538995},森:{jlpt_level:2,joyo_grade:1,frequency:1000,nhk_rel_freq:0.00030989514160310655,aozora_rel_freq:0.00029903266410286723,news_rel_freq:0.000467798104269261,twitter_rel_freq:0.0005004544770335674,wikipedia_rel_freq:0.0005948165973851968},競:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0007715756586852857,aozora_rel_freq:0.00009590257650226423,news_rel_freq:0.0006079340186619171,twitter_rel_freq:0.0001534247298275466,wikipedia_rel_freq:0.000904700606759401},介:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0014040147231814215,aozora_rel_freq:0.00034794550340460945,news_rel_freq:0.00039647028062265316,twitter_rel_freq:0.000333036612238036,wikipedia_rel_freq:0.0004650924038786801},根:{jlpt_level:2,joyo_grade:3,frequency:1000,nhk_rel_freq:0.000531248814176754,aozora_rel_freq:0.0007891323208077743,news_rel_freq:0.00043620453020839936,twitter_rel_freq:0.00036582052844874303,wikipedia_rel_freq:0.0004496086550678764},販:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00001785182657597343,news_rel_freq:0.0004602389055675824,twitter_rel_freq:0.00024308074458670575,wikipedia_rel_freq:0.00028996595350768876},歴:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00021502928192868617,aozora_rel_freq:0.0003648649168405973,news_rel_freq:0.00029984821516658243,twitter_rel_freq:0.00014532870173892688,wikipedia_rel_freq:0.0011475219355540501},将:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.000265624407088377,aozora_rel_freq:0.0004556586463466907,news_rel_freq:0.0003243671545451039,twitter_rel_freq:0.00020110133968275165,wikipedia_rel_freq:0.0004638738935178694},幅:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00007987672565876251,news_rel_freq:0.00043998412955923864,twitter_rel_freq:0.00004957567817228868,wikipedia_rel_freq:0.00020670065398814877},般:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.0002401352340937797,news_rel_freq:0.0001809362048209468,twitter_rel_freq:0.00008775694644207551,wikipedia_rel_freq:0.0003891470886709977},貿:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00017075854741395666,aozora_rel_freq:0.000020299411068435513,news_rel_freq:0.00007413829495877038,twitter_rel_freq:0.000003998038562281345,wikipedia_rel_freq:0.000041431901452418845},講:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00019444699023448754,news_rel_freq:0.00019547312540109786,twitter_rel_freq:0.00027016745584616185,wikipedia_rel_freq:0.00030426050758351715},林:{jlpt_level:2,joyo_grade:1,frequency:1000,nhk_rel_freq:0.0002719487977333384,aozora_rel_freq:0.00045290025747423345,news_rel_freq:0.00027775209588475286,twitter_rel_freq:0.00017581374577632213,wikipedia_rel_freq:0.00048547313679642384},装:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00011383903160930444,aozora_rel_freq:0.00023318098609138743,news_rel_freq:0.0003479169658849486,twitter_rel_freq:0.0002561743208781772,wikipedia_rel_freq:0.0007280726865086659},諸:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00020238050063876346,aozora_rel_freq:0.0004684599017477424,news_rel_freq:0.0001533160557186598,twitter_rel_freq:0.00005607249083599586,wikipedia_rel_freq:0.0002805964245722082},劇:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00018973171934884075,aozora_rel_freq:0.0004129424693711025,news_rel_freq:0.00014013591439265618,twitter_rel_freq:0.00016311997334107886,wikipedia_rel_freq:0.0005575475148014053},河:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0001960561099938021,aozora_rel_freq:0.00046090347025910946,news_rel_freq:0.0003468509250424042,twitter_rel_freq:0.00023608417710271342,wikipedia_rel_freq:0.0006623521517554013},航:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0004933024703069859,aozora_rel_freq:0.00006286018585402614,news_rel_freq:0.000523910617708644,twitter_rel_freq:0.00006166974482318975,wikipedia_rel_freq:0.0005642149077903182},鉄:{jlpt_level:2,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0006830341896558266,aozora_rel_freq:0.0002935935874529515,news_rel_freq:0.0003393886391445933,twitter_rel_freq:0.00046247311069189454,wikipedia_rel_freq:0.0018117770538038972},児:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00036681465740775874,aozora_rel_freq:0.0003056761077252643,news_rel_freq:0.0006314838300017618,twitter_rel_freq:0.0002600724084764015,wikipedia_rel_freq:0.0003865150553079495},禁:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00020870489128372482,aozora_rel_freq:0.0001169012974256889,news_rel_freq:0.0002977161334814936,twitter_rel_freq:0.00020469957438880486,wikipedia_rel_freq:0.00016248121889651134},印:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00010751464096434309,aozora_rel_freq:0.0002735855554907615,news_rel_freq:0.0001389729607462441,twitter_rel_freq:0.0008508825570175272,wikipedia_rel_freq:0.00020157679242909125},逆:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00019800181533068245,news_rel_freq:0.00025333006931009907,twitter_rel_freq:0.0003529268540853857,wikipedia_rel_freq:0.00017058507755135903},換:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00015868506126129157,news_rel_freq:0.00020332306251437943,twitter_rel_freq:0.0006587768040999085,wikipedia_rel_freq:0.0004004361538024834},久:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00017075854741395666,aozora_rel_freq:0.0005037361988771958,news_rel_freq:0.0004627586384681419,twitter_rel_freq:0.001968134433247049,wikipedia_rel_freq:0.0006116960249042512},短:{jlpt_level:2,joyo_grade:3,frequency:1000,nhk_rel_freq:0.00027827318837829977,aozora_rel_freq:0.00024928453802988796,news_rel_freq:0.00018277754809443262,twitter_rel_freq:0.00022728849226569446,wikipedia_rel_freq:0.00033356466208707224},油:{jlpt_level:2,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0005565463767565995,aozora_rel_freq:0.00019106699260203989,news_rel_freq:0.00027358484531844285,twitter_rel_freq:0.00020050163389840944,wikipedia_rel_freq:0.00014625310810797393},暴:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00020798640603802778,news_rel_freq:0.00040935968353705376,twitter_rel_freq:0.00020799795620268696,wikipedia_rel_freq:0.00014955685168038116},輪:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00021919478899160412,news_rel_freq:0.0006417565872117352,twitter_rel_freq:0.00017011654082507122,wikipedia_rel_freq:0.0002442233804650379},占:{jlpt_level:2,joyo_grade:9,frequency:1000,aozora_rel_freq:0.000125157038769311,news_rel_freq:0.0001585493471275142,twitter_rel_freq:0.0001025496891225165,wikipedia_rel_freq:0.00015048985333740358},植:{jlpt_level:2,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0003288683135379906,aozora_rel_freq:0.00021284272447545254,news_rel_freq:0.0001913058748347879,twitter_rel_freq:0.00010274959105063056,wikipedia_rel_freq:0.0002743815118951026},清:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00011383903160930444,aozora_rel_freq:0.00046954771707772555,news_rel_freq:0.00025013194678246586,twitter_rel_freq:0.00025737373244686155,wikipedia_rel_freq:0.0004743510432729572},倍:{jlpt_level:2,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0009739561593240492,aozora_rel_freq:0.00010093372240343628,news_rel_freq:0.0006778081502505099,twitter_rel_freq:0.0002580733891952608,wikipedia_rel_freq:0.00009905877429025682},均:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0005059512515969086,aozora_rel_freq:0.00005982984314907309,news_rel_freq:0.0005531782844766816,twitter_rel_freq:0.0000719646941210642,wikipedia_rel_freq:0.0001319598286245732},億:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0011004439722232763,aozora_rel_freq:0.00002649607339458951,news_rel_freq:0.0009560448101546011,twitter_rel_freq:0.000058171461081193567,wikipedia_rel_freq:0.00016915625943999},圧:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.00014955518259893302,news_rel_freq:0.0004950306021560773,twitter_rel_freq:0.00017741296120123468,wikipedia_rel_freq:0.00021543416130224383},芸:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0001517853754790726,aozora_rel_freq:0.0006135278461104949,news_rel_freq:0.0001842312401524477,twitter_rel_freq:0.00020639874077777443,wikipedia_rel_freq:0.000508447665304387},署:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0001517853754790726,aozora_rel_freq:0.00007865293341253146,news_rel_freq:0.0005173205470456422,twitter_rel_freq:0.00004997548202851681,wikipedia_rel_freq:0.0001870885003042637},伸:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00036688514531056605,news_rel_freq:0.00031855238631304345,twitter_rel_freq:0.00019150604713327643,wikipedia_rel_freq:0.00015288226332405805},停:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.0001456895531227429,news_rel_freq:0.00037582785339883865,twitter_rel_freq:0.00019640364437207105,wikipedia_rel_freq:0.00034378306957935184},爆:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.001448285457696151,aozora_rel_freq:0.00009619395560850971,news_rel_freq:0.000422055260843719,twitter_rel_freq:0.0018964695920181559,wikipedia_rel_freq:0.00023634894844716295},陸:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0005881683299814063,aozora_rel_freq:0.0001843069973371446,news_rel_freq:0.0005541474125153583,twitter_rel_freq:0.0001923056548457327,wikipedia_rel_freq:0.0006966960447177906},玉:{jlpt_level:2,joyo_grade:1,frequency:1000,nhk_rel_freq:0.0003604902667627974,aozora_rel_freq:0.0003716443373792423,news_rel_freq:0.00033212017885451777,twitter_rel_freq:0.0008811676991268084,wikipedia_rel_freq:0.0004102900278604619},波:{jlpt_level:2,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0008537927370697833,aozora_rel_freq:0.0005082622876608758,news_rel_freq:0.0005444561321285909,twitter_rel_freq:0.00034513067888893706,wikipedia_rel_freq:0.0004937745572775535},帯:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00046800490772714047,aozora_rel_freq:0.0002873774998530478,news_rel_freq:0.0003460756226114628,twitter_rel_freq:0.0004451815939100277,wikipedia_rel_freq:0.00042067285777590535},延:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.00017119493755609775,news_rel_freq:0.0003716606028325287,twitter_rel_freq:0.00015372458271971771,wikipedia_rel_freq:0.0002640190754585012},羽:{jlpt_level:2,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0006767097990108653,aozora_rel_freq:0.0003539284877195168,news_rel_freq:0.0003054691577909075,twitter_rel_freq:0.0003489288155231044,wikipedia_rel_freq:0.0002721624464786053},固:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.0002602598176984679,news_rel_freq:0.00018927070595356674,twitter_rel_freq:0.0001055482180442275,wikipedia_rel_freq:0.0001588766715111843},則:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00021502928192868617,aozora_rel_freq:0.0001539841450138644,news_rel_freq:0.00015971230077392628,twitter_rel_freq:0.00006566778338547108,wikipedia_rel_freq:0.00022327672850942817},乱:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00009486585967442038,aozora_rel_freq:0.00031494196330387076,news_rel_freq:0.0001607783416164707,twitter_rel_freq:0.00010954625660650885,wikipedia_rel_freq:0.00021966325897710773},普:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0003035707509581452,aozora_rel_freq:0.00026329016040342097,news_rel_freq:0.0002252253561884737,twitter_rel_freq:0.0007121506189063646,wikipedia_rel_freq:0.00024691022130247405},測:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.00009615510506101032,news_rel_freq:0.00030459694255609846,twitter_rel_freq:0.00010534831611611344,wikipedia_rel_freq:0.00018861163825527707},豊:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.00020015802071689904,news_rel_freq:0.0002670916874593087,twitter_rel_freq:0.000505252123308305,wikipedia_rel_freq:0.0004040305044483894},厚:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0006387634551410971,aozora_rel_freq:0.00013844392601410516,news_rel_freq:0.0003164203046279547,twitter_rel_freq:0.00017611359866849324,wikipedia_rel_freq:0.00013036403890518512},齢:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00006682294169896474,news_rel_freq:0.00023859932312221267,twitter_rel_freq:0.00008735714258584738,wikipedia_rel_freq:0.00025537733879919523},囲:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.0003093863350114568,news_rel_freq:0.0002488720803321861,twitter_rel_freq:0.00020300040799983528,wikipedia_rel_freq:0.0002764310565187256},卒:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00017708293805891801,aozora_rel_freq:0.00013079036815672373,news_rel_freq:0.00011784596950309123,twitter_rel_freq:0.0002095971716275995,wikipedia_rel_freq:0.00028582480271033105},略:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0001439607037590197,news_rel_freq:0.00018520036819112446,twitter_rel_freq:0.00030774901833160653,wikipedia_rel_freq:0.00041196101853307993},承:{jlpt_level:2,joyo_grade:5,frequency:1000,aozora_rel_freq:0.0002480607457836569,news_rel_freq:0.00019653916624364228,twitter_rel_freq:0.00006256930349970305,wikipedia_rel_freq:0.0001978294906918701},順:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.0001889884883108221,news_rel_freq:0.0002469338242548326,twitter_rel_freq:0.00014282992763750104,wikipedia_rel_freq:0.0003244640721538208},岩:{jlpt_level:2,joyo_grade:2,frequency:1000,nhk_rel_freq:0.000423734173212411,aozora_rel_freq:0.00037102272861925194,news_rel_freq:0.0004747758261477335,twitter_rel_freq:0.00032314146679638967,wikipedia_rel_freq:0.000496706119861094},練:{jlpt_level:2,joyo_grade:3,frequency:1000,nhk_rel_freq:0.00051227564224187,aozora_rel_freq:0.00014246495768029287,news_rel_freq:0.0005192588031229957,twitter_rel_freq:0.0007228453720604671,wikipedia_rel_freq:0.00017239754798344356},軽:{jlpt_level:2,joyo_grade:3,frequency:1000,nhk_rel_freq:0.00018340732870387937,aozora_rel_freq:0.00038293042142781747,news_rel_freq:0.0003214597704290737,twitter_rel_freq:0.00031824386955759505,wikipedia_rel_freq:0.00018975877144014069},了:{jlpt_level:2,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00020860801479801814,news_rel_freq:0.00029994512797045013,twitter_rel_freq:0.0005922094620379242,wikipedia_rel_freq:0.00046582911830184804},庁:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.001271202519637233,aozora_rel_freq:0.00004689261083177352,news_rel_freq:0.001290781634713546,twitter_rel_freq:0.00007286425279757751,wikipedia_rel_freq:0.0003134133558063012},城:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0012079586131876195,aozora_rel_freq:0.00045192899378674846,news_rel_freq:0.0006981598390627214,twitter_rel_freq:0.0008054048683715769,wikipedia_rel_freq:0.0010034815199004353},患:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00007503983249508744,news_rel_freq:0.00020409836494532084,twitter_rel_freq:0.00003548259224024693,wikipedia_rel_freq:0.00007595168816982055},層:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00022966501154269192,news_rel_freq:0.000155932701423087,twitter_rel_freq:0.00004707690407086283,wikipedia_rel_freq:0.0001455380617560756},版:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.0003813569742540918,news_rel_freq:0.0002005125912022169,twitter_rel_freq:0.0001629200714129648,wikipedia_rel_freq:0.001807730222846184},令:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.000246312471146184,news_rel_freq:0.00022619448422715044,twitter_rel_freq:0.000042978914544524455,wikipedia_rel_freq:0.00035213547375758666},角:{jlpt_level:2,joyo_grade:2,frequency:1000,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.0005668100627424687,news_rel_freq:0.0001389729607462441,twitter_rel_freq:0.0001795119314464324,wikipedia_rel_freq:0.0003711919051430267},絡:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00027827318837829977,aozora_rel_freq:0.00006557972417898401,news_rel_freq:0.00021243286607794076,twitter_rel_freq:0.0008450854011022192,wikipedia_rel_freq:0.00009889690105194827},損:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00011171474933451926,news_rel_freq:0.00026273061128526343,twitter_rel_freq:0.00007956096738939876,wikipedia_rel_freq:0.00010508759647292897},募:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.000025796763539600342,news_rel_freq:0.00015321914291479213,twitter_rel_freq:0.0003314373968131235,wikipedia_rel_freq:0.00010494229293617957},裏:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.0004058328191787126,news_rel_freq:0.00011484167258319334,twitter_rel_freq:0.0005109493282595558,wikipedia_rel_freq:0.00015945788565818186},仏:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0001644341567689953,aozora_rel_freq:0.00034392447173842177,news_rel_freq:0.0001989619863403341,twitter_rel_freq:0.00009145513211218576,wikipedia_rel_freq:0.00018183208113273304},績:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00004683433501052442,news_rel_freq:0.0002470307370587003,twitter_rel_freq:0.00019820276172509765,wikipedia_rel_freq:0.0003701378172053798},築:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00014546098483411124,aozora_rel_freq:0.00014666081681022786,news_rel_freq:0.00014013591439265618,twitter_rel_freq:0.0000805604770299691,wikipedia_rel_freq:0.00035290277839901765},貨:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00020238050063876346,aozora_rel_freq:0.0001252347398643098,news_rel_freq:0.00014585376982084893,twitter_rel_freq:0.00006536793049329999,wikipedia_rel_freq:0.0002295770388791847},混:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00008854146902945901,aozora_rel_freq:0.0001747109121047933,news_rel_freq:0.00017279552929606222,twitter_rel_freq:0.0002405819704852799,wikipedia_rel_freq:0.00014629771884294086},昇:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00008178040248623301,news_rel_freq:0.00037757228386845675,twitter_rel_freq:0.00010684758057696894,wikipedia_rel_freq:0.00019889887373864852},池:{jlpt_level:2,joyo_grade:2,frequency:1000,nhk_rel_freq:0.00038578782934264286,aozora_rel_freq:0.00021307582776044893,news_rel_freq:0.0002214457568376344,twitter_rel_freq:0.00044927958343636613,wikipedia_rel_freq:0.0003445376282965066},血:{jlpt_level:2,joyo_grade:3,frequency:1000,nhk_rel_freq:0.000423734173212411,aozora_rel_freq:0.0004516181894067533,news_rel_freq:0.00019246882848119999,twitter_rel_freq:0.000288358531304542,wikipedia_rel_freq:0.0003484901394145756},温:{jlpt_level:2,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0013028244728620398,aozora_rel_freq:0.00024147557798250894,news_rel_freq:0.0003022710352632743,twitter_rel_freq:0.0005995058824140876,wikipedia_rel_freq:0.00027665538478598785},季:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00028459757902326113,aozora_rel_freq:0.00010033153891719562,news_rel_freq:0.0008362605845741565,twitter_rel_freq:0.00017041639371724232,wikipedia_rel_freq:0.00022031330111519712},星:{jlpt_level:2,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0011573634880279284,aozora_rel_freq:0.00030925035809520893,news_rel_freq:0.00035702676944850993,twitter_rel_freq:0.0003102477924330324,wikipedia_rel_freq:0.0007765722029722723},永:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00011383903160930444,aozora_rel_freq:0.00034825630778460463,news_rel_freq:0.0002515856388404809,twitter_rel_freq:0.00024018216662905178,wikipedia_rel_freq:0.00037849659434575276},著:{jlpt_level:2,joyo_grade:6,frequency:1000,aozora_rel_freq:0.00026367866587841495,news_rel_freq:0.00009167951245881933,twitter_rel_freq:0.000031384602713908557,wikipedia_rel_freq:0.0006355500221872765},誌:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.00018547251376212657,news_rel_freq:0.00011028677080141268,twitter_rel_freq:0.00006976577291180947,wikipedia_rel_freq:0.00038772209433691156},庫:{jlpt_level:2,joyo_grade:3,frequency:1000,nhk_rel_freq:0.0003604902667627974,aozora_rel_freq:0.0009341808398967772,news_rel_freq:0.0002811440440201214,twitter_rel_freq:0.000499255065464883,wikipedia_rel_freq:0.0005105214271841349},刊:{jlpt_level:2,joyo_grade:5,frequency:1000,aozora_rel_freq:0.00008094511571499595,news_rel_freq:0.00009371468134004048,twitter_rel_freq:0.00006097008807479051,wikipedia_rel_freq:0.00046026807154011477},像:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0004743292983721018,aozora_rel_freq:0.0004866419579774607,news_rel_freq:0.0003675902650700864,twitter_rel_freq:0.0006730697919600644,wikipedia_rel_freq:0.0015075076240733867},香:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00028459757902326113,aozora_rel_freq:0.0002688069381483355,news_rel_freq:0.0004614987720178622,twitter_rel_freq:0.00038661032897260606,wikipedia_rel_freq:0.0004411976196379708},坂:{jlpt_level:2,joyo_grade:3,frequency:1000,nhk_rel_freq:0.00013913659418914989,aozora_rel_freq:0.0003166319621200946,news_rel_freq:0.0002226087104840465,twitter_rel_freq:0.00036602043037685714,wikipedia_rel_freq:0.00038363957479122467},底:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.0011009662403116934,news_rel_freq:0.00015380061973799817,twitter_rel_freq:0.00008805679933424662,wikipedia_rel_freq:0.00009711884461540966},布:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0001517853754790726,aozora_rel_freq:0.00028848474045678067,news_rel_freq:0.0001507963228181003,twitter_rel_freq:0.00041779502975840054,wikipedia_rel_freq:0.00023138058716427586},寺:{jlpt_level:2,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0004869780796620246,aozora_rel_freq:0.0005564369665601293,news_rel_freq:0.0002643781289510139,twitter_rel_freq:0.00045887487598584133,wikipedia_rel_freq:0.0007259836295197865},宇:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0012459049570573875,aozora_rel_freq:0.00015872391180879098,news_rel_freq:0.00029732848226602293,twitter_rel_freq:0.000309148331828405,wikipedia_rel_freq:0.00045644301966480836},巨:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00010536268481836767,news_rel_freq:0.0003247548057605746,twitter_rel_freq:0.00016252026755673668,wikipedia_rel_freq:0.0001816319701215957},震:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0027068391960434614,aozora_rel_freq:0.00017422528026105082,news_rel_freq:0.002914652576320287,twitter_rel_freq:0.0006463828845568364,wikipedia_rel_freq:0.00017815743116388657},希:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.00014619461024023507,news_rel_freq:0.00018006398958613775,twitter_rel_freq:0.00036382150916760235,wikipedia_rel_freq:0.00015014826256679975},触:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00013913659418914989,aozora_rel_freq:0.00021020088724549345,news_rel_freq:0.00018277754809443262,twitter_rel_freq:0.00016461923780193438,wikipedia_rel_freq:0.00010713586650412435},依:{jlpt_level:2,joyo_grade:9,frequency:1000,aozora_rel_freq:0.0002140082409004345,news_rel_freq:0.0001157138878180024,twitter_rel_freq:0.00006526797952924295,wikipedia_rel_freq:0.0020921096377435867},籍:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00006449190884900086,news_rel_freq:0.00017676895425463684,twitter_rel_freq:0.00004277901261641039,wikipedia_rel_freq:0.00044274879862239193},汚:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00033519270418295197,aozora_rel_freq:0.0001317616318442087,news_rel_freq:0.00011590771342573776,twitter_rel_freq:0.00016192056177239447,wikipedia_rel_freq:0.00004097942114061153},枚:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00022767806321860888,aozora_rel_freq:0.0002751978532119865,news_rel_freq:0.0001356779254147432,twitter_rel_freq:0.0004932580076214609,wikipedia_rel_freq:0.00024027341853182418},複:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00009186211956232683,news_rel_freq:0.0002697083331637359,twitter_rel_freq:0.00006936596905558133,wikipedia_rel_freq:0.00029961079440753656},郵:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00018973171934884075,aozora_rel_freq:0.000048738011837994926,news_rel_freq:0.0000766580278593299,twitter_rel_freq:0.00006866631230718209,wikipedia_rel_freq:0.0003480491304346169},仲:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.0003225178200662534,news_rel_freq:0.00013625940223794923,twitter_rel_freq:0.00081440045513671,wikipedia_rel_freq:0.00018911127848690655},栄:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00017096183427110139,news_rel_freq:0.0001581616959120435,twitter_rel_freq:0.00017681325541689247,wikipedia_rel_freq:0.00022272355539583837},札:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00020238050063876346,aozora_rel_freq:0.00012581749807680077,news_rel_freq:0.00031535426378541024,twitter_rel_freq:0.00048716099881398187,wikipedia_rel_freq:0.00023353337377453656},板:{jlpt_level:2,joyo_grade:3,frequency:1000,nhk_rel_freq:0.00017708293805891801,aozora_rel_freq:0.00030258748919906217,news_rel_freq:0.00029878217432403805,twitter_rel_freq:0.00020559913306531814,wikipedia_rel_freq:0.0002818149349330189},骨:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00010751464096434309,aozora_rel_freq:0.0003301325273761354,news_rel_freq:0.00019004600838450815,twitter_rel_freq:0.00019170594906139048,wikipedia_rel_freq:0.00012663330686952308},傾:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.0002339774223151251,news_rel_freq:0.00010767012509698548,twitter_rel_freq:0.00003058499500145229,wikipedia_rel_freq:0.00008964590921223697},届:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00043005856385737234,aozora_rel_freq:0.00013317967682793672,news_rel_freq:0.00021621246542878004,twitter_rel_freq:0.00031824386955759505,wikipedia_rel_freq:0.00005612922673537712},巻:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00035416587611783603,aozora_rel_freq:0.0005567477709401246,news_rel_freq:0.00021136682523539634,twitter_rel_freq:0.0002945554910760781,wikipedia_rel_freq:0.0005870670754252292},燃:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0004933024703069859,aozora_rel_freq:0.0001767894163960111,news_rel_freq:0.000178804123135858,twitter_rel_freq:0.00011904159819192704,wikipedia_rel_freq:0.00011927890856211963},跡:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00027827318837829977,aozora_rel_freq:0.0002344242036113682,news_rel_freq:0.00020836252831549847,twitter_rel_freq:0.0001311356648428281,wikipedia_rel_freq:0.00029908438773492693},包:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00008854146902945901,aozora_rel_freq:0.00023448247943261727,news_rel_freq:0.00010485965378482294,twitter_rel_freq:0.00006396861699650152,wikipedia_rel_freq:0.00008808453348839481},駐:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00008854146902945901,aozora_rel_freq:0.000020299411068435513,news_rel_freq:0.00011493858538706101,twitter_rel_freq:0.00012683777338837567,wikipedia_rel_freq:0.00013808042146203441},弱:{jlpt_level:2,joyo_grade:2,frequency:1000,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.00033955378514473946,news_rel_freq:0.00011920274875723865,twitter_rel_freq:0.0002428808426585917,wikipedia_rel_freq:0.00010947091983153564},紹:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.001094119581578315,aozora_rel_freq:0.00009632993252475761,news_rel_freq:0.0001105775092130157,twitter_rel_freq:0.0001956040366596148,wikipedia_rel_freq:0.00018208572502583068},雇:{jlpt_level:2,joyo_grade:9,frequency:1000,aozora_rel_freq:0.000054293640130408855,news_rel_freq:0.00016194129526288277,twitter_rel_freq:0.00003258401428259296,wikipedia_rel_freq:0.000057714819715344176},替:{jlpt_level:2,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00008477189464368667,news_rel_freq:0.0003421021976528882,twitter_rel_freq:0.0003577245003601233,wikipedia_rel_freq:0.00025255794034928595},預:{jlpt_level:2,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.0000801292542175086,news_rel_freq:0.00007190930046981388,twitter_rel_freq:0.000039080826946300145,wikipedia_rel_freq:0.00004369175382660019},焼:{jlpt_level:2,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00036681465740775874,aozora_rel_freq:0.00032104149926127625,news_rel_freq:0.00019363178212761207,twitter_rel_freq:0.000978419987154302,wikipedia_rel_freq:0.00014483193755117067},簡:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00030989514160310655,aozora_rel_freq:0.0001622204610837368,news_rel_freq:0.00008789991310798005,twitter_rel_freq:0.00015742276838982795,wikipedia_rel_freq:0.00011818785744407155},章:{jlpt_level:2,joyo_grade:3,frequency:1000,nhk_rel_freq:0.00008854146902945901,aozora_rel_freq:0.0002443310932237147,news_rel_freq:0.00009565293741739395,twitter_rel_freq:0.00007096518448049387,wikipedia_rel_freq:0.0004620754436024888},臓:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.000265624407088377,aozora_rel_freq:0.00008545177922492614,news_rel_freq:0.00009923871116049788,twitter_rel_freq:0.00007766189907231512,wikipedia_rel_freq:0.000045250580365587086},律:{jlpt_level:2,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00032254392289302926,aozora_rel_freq:0.00016202620834623982,news_rel_freq:0.00008906286675439213,twitter_rel_freq:0.00005057518781285901,wikipedia_rel_freq:0.00017893875632202146},贈:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00006338466824526801,news_rel_freq:0.00013005698279041811,twitter_rel_freq:0.00002268886884094663,wikipedia_rel_freq:0.00005503945020975668},照:{jlpt_level:2,joyo_grade:4,frequency:1500,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.0003004507090865953,news_rel_freq:0.00015099014842583563,twitter_rel_freq:0.00019280540966601785,wikipedia_rel_freq:0.00042984992325481434},薄:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00041373890559484014,news_rel_freq:0.00005698472867419214,twitter_rel_freq:0.00011304454034850502,wikipedia_rel_freq:0.00006227148764410802},群:{jlpt_level:2,joyo_grade:5,frequency:1500,nhk_rel_freq:0.00024665123515349294,aozora_rel_freq:0.00026060947262596253,news_rel_freq:0.00022929569395091598,twitter_rel_freq:0.00024008221566499476,wikipedia_rel_freq:0.00031677573063037927},秒:{jlpt_level:2,joyo_grade:3,frequency:1500,nhk_rel_freq:0.0002909219696682225,aozora_rel_freq:0.00003094446108327059,news_rel_freq:0.00026515343138195524,twitter_rel_freq:0.00020529928017314707,wikipedia_rel_freq:0.0004066740091432862},奥:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.0005530958194751812,news_rel_freq:0.00010747629948925014,twitter_rel_freq:0.00015422433754000287,wikipedia_rel_freq:0.000196435086576047},詰:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00022931535661519734,news_rel_freq:0.00011396945734838428,twitter_rel_freq:0.0001882076653193943,wikipedia_rel_freq:0.00006009320918529476},双:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00009184269428857713,news_rel_freq:0.00009371468134004048,twitter_rel_freq:0.00007436351725843302,wikipedia_rel_freq:0.00013873811115468958},刺:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00020238050063876346,aozora_rel_freq:0.00021241536845295915,news_rel_freq:0.00015990612638166162,twitter_rel_freq:0.00020240070221549307,wikipedia_rel_freq:0.00008075052865983337},純:{jlpt_level:2,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.000271876131400788,news_rel_freq:0.00014905189234848217,twitter_rel_freq:0.00018331006808059965,wikipedia_rel_freq:0.00021680944653165257},翌:{jlpt_level:2,joyo_grade:6,frequency:1500,aozora_rel_freq:0.00020180916898562346,news_rel_freq:0.0000803407144063015,twitter_rel_freq:0.000027286613187570177,wikipedia_rel_freq:0.00019380560239785403},快:{jlpt_level:2,joyo_grade:5,frequency:1500,aozora_rel_freq:0.00037506318555918935,news_rel_freq:0.00018878614193422837,twitter_rel_freq:0.00022349035563152717,wikipedia_rel_freq:0.00011781950023248757},片:{jlpt_level:2,joyo_grade:6,frequency:1500,nhk_rel_freq:0.0001517853754790726,aozora_rel_freq:0.0006128091109817561,news_rel_freq:0.00012666503465504954,twitter_rel_freq:0.00025467505641732166,wikipedia_rel_freq:0.00018112850611268336},敬:{jlpt_level:2,joyo_grade:6,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00021898111098035743,news_rel_freq:0.00007326607972396132,twitter_rel_freq:0.00012393919543072168,wikipedia_rel_freq:0.00010976280149746205},悩:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00012445772891432185,news_rel_freq:0.00006735439868803322,twitter_rel_freq:0.0002479783418255004,wikipedia_rel_freq:0.00004307612568405671},泉:{jlpt_level:2,joyo_grade:6,frequency:1500,nhk_rel_freq:0.0002529756257984543,aozora_rel_freq:0.00021643640011914685,news_rel_freq:0.00016669002265239877,twitter_rel_freq:0.0004323878705107274,wikipedia_rel_freq:0.0004042828737490594},皮:{jlpt_level:2,joyo_grade:3,frequency:1500,nhk_rel_freq:0.00014546098483411124,aozora_rel_freq:0.00025536464871354377,news_rel_freq:0.000041963244074702714,twitter_rel_freq:0.00008195979052676757,wikipedia_rel_freq:0.0000848649130162109},漁:{jlpt_level:2,joyo_grade:4,frequency:1500,nhk_rel_freq:0.0003731390480527201,aozora_rel_freq:0.00009009441965110421,news_rel_freq:0.00019246882848119999,twitter_rel_freq:0.00004058009140715565,wikipedia_rel_freq:0.00007259823549273589},荒:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00027346900384826327,news_rel_freq:0.00009138877404721631,twitter_rel_freq:0.00022628898262512412,wikipedia_rel_freq:0.00018089398110600013},貯:{jlpt_level:2,joyo_grade:4,frequency:1500,aozora_rel_freq:0.00003954985735438728,news_rel_freq:0.00005339895493108821,twitter_rel_freq:0.00012913664556168743,wikipedia_rel_freq:0.00003965129583102498},硬:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.000040288017756875835,news_rel_freq:0.00004632432024874803,twitter_rel_freq:0.0000350827883840188,wikipedia_rel_freq:0.00008036560174669024},埋:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.00021429962000667996,news_rel_freq:0.00014759820029046705,twitter_rel_freq:0.0000808603299221402,wikipedia_rel_freq:0.00006967941883347178},柱:{jlpt_level:2,joyo_grade:3,frequency:1500,nhk_rel_freq:0.00022767806321860888,aozora_rel_freq:0.00015336253625387403,news_rel_freq:0.00010553804341189667,twitter_rel_freq:0.000023288574625288834,wikipedia_rel_freq:0.00005503690102490143},祭:{jlpt_level:2,joyo_grade:3,frequency:1500,nhk_rel_freq:0.0004110853919224883,aozora_rel_freq:0.00019545710446947187,news_rel_freq:0.00022125193122989907,twitter_rel_freq:0.0009443367084108537,wikipedia_rel_freq:0.00032976765124517364},袋:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00035416587611783603,aozora_rel_freq:0.0001789456217822277,news_rel_freq:0.00008460487777647915,twitter_rel_freq:0.0003445309731045949,wikipedia_rel_freq:0.0000729003138980833},筆:{jlpt_level:2,joyo_grade:3,frequency:1500,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.00035684227878197164,news_rel_freq:0.00007723950468253594,twitter_rel_freq:0.00006766680266661176,wikipedia_rel_freq:0.00036042287372201255},訓:{jlpt_level:2,joyo_grade:4,frequency:1500,nhk_rel_freq:0.00025930001644341565,aozora_rel_freq:0.00008523810121367945,news_rel_freq:0.000188010839503287,twitter_rel_freq:0.000058071510117136534,wikipedia_rel_freq:0.00012090656309219834},浴:{jlpt_level:2,joyo_grade:4,frequency:1500,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00016497884995619405,news_rel_freq:0.00008634930824609728,twitter_rel_freq:0.00015402443561188882,wikipedia_rel_freq:0.00005730185176879327},童:{jlpt_level:2,joyo_grade:3,frequency:1500,nhk_rel_freq:0.00015810976612403395,aozora_rel_freq:0.00016049161172001358,news_rel_freq:0.0001437216881357601,twitter_rel_freq:0.00008715724065773332,wikipedia_rel_freq:0.00013292469509228625},宝:{jlpt_level:2,joyo_grade:6,frequency:1500,nhk_rel_freq:0.0002403268445085316,aozora_rel_freq:0.0001642018390062061,news_rel_freq:0.00013868222233464107,twitter_rel_freq:0.00013923169293144784,wikipedia_rel_freq:0.00034750615406044813},封:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00013669565137663223,news_rel_freq:0.00010330904892294017,twitter_rel_freq:0.00006546788145735702,wikipedia_rel_freq:0.00010293990823237873},胸:{jlpt_level:2,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.0005553297259563966,news_rel_freq:0.00007413829495877038,twitter_rel_freq:0.00013783237943464937,wikipedia_rel_freq:0.00005156491125204752},砂:{jlpt_level:2,joyo_grade:6,frequency:1500,nhk_rel_freq:0.0003162195322480679,aozora_rel_freq:0.00019155262444578238,news_rel_freq:0.00019993111437901085,twitter_rel_freq:0.00011874174529975595,wikipedia_rel_freq:0.00013497041593862639},塩:{jlpt_level:2,joyo_grade:4,frequency:1500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00011668761941444221,news_rel_freq:0.00009574985022126162,twitter_rel_freq:0.0001855089892898544,wikipedia_rel_freq:0.00016312361348003496},賢:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.00009798108079348202,news_rel_freq:0.00005184835006920543,twitter_rel_freq:0.000046477198286520635,wikipedia_rel_freq:0.00009259913986704698},腕:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00011383903160930444,aozora_rel_freq:0.00032069184433378167,news_rel_freq:0.00013499953578766948,twitter_rel_freq:0.00016671820804713207,wikipedia_rel_freq:0.00011704582262891844},兆:{jlpt_level:2,joyo_grade:4,frequency:1500,nhk_rel_freq:0.0001960561099938021,aozora_rel_freq:0.000025719062444601548,news_rel_freq:0.0002281327403045039,twitter_rel_freq:0.000023388525589345867,wikipedia_rel_freq:0.00002656250619173103},床:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0001517853754790726,aozora_rel_freq:0.000323897014502482,news_rel_freq:0.0001005954904146453,twitter_rel_freq:0.00008415871173602231,wikipedia_rel_freq:0.0001176410572926199},毛:{jlpt_level:2,joyo_grade:2,frequency:1500,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.0003757819206879282,news_rel_freq:0.00006638527064935649,twitter_rel_freq:0.00048396256796415677,wikipedia_rel_freq:0.0001897638698098512},緑:{jlpt_level:2,joyo_grade:3,frequency:1500,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.00014042530393657446,news_rel_freq:0.00005795385671286888,twitter_rel_freq:0.00016481913973004844,wikipedia_rel_freq:0.00014792027500330906},尊:{jlpt_level:2,joyo_grade:6,frequency:1500,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00027189555667453765,news_rel_freq:0.000058729159143810265,twitter_rel_freq:0.00009145513211218576,wikipedia_rel_freq:0.00009340850605858966},祝:{jlpt_level:2,joyo_grade:4,frequency:1500,nhk_rel_freq:0.0004363829545023337,aozora_rel_freq:0.00012601175081429776,news_rel_freq:0.00008915977955825981,twitter_rel_freq:0.00021729339585999108,wikipedia_rel_freq:0.00006449182765303294},柔:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00011814451494566964,news_rel_freq:0.00009749428069087974,twitter_rel_freq:0.00008106023185025426,wikipedia_rel_freq:0.00010160031159094355},殿:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.00039948075466256103,news_rel_freq:0.00009497454779032023,twitter_rel_freq:0.00009925130730863438,wikipedia_rel_freq:0.0001755508896493909},濃:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00008854146902945901,aozora_rel_freq:0.0001520998934601436,news_rel_freq:0.00010214609527652809,twitter_rel_freq:0.00019040658652864903,wikipedia_rel_freq:0.00012249088147973778},液:{jlpt_level:2,joyo_grade:5,frequency:1500,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00004811640307800456,news_rel_freq:0.00008935360516599515,twitter_rel_freq:0.000056372343728166964,wikipedia_rel_freq:0.0002228178752354827},衣:{jlpt_level:2,joyo_grade:4,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.0003635051476781184,news_rel_freq:0.00009439307096711419,twitter_rel_freq:0.00018021158819483163,wikipedia_rel_freq:0.00015198240107015392},肩:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.0002999845025166025,news_rel_freq:0.00006444701457200302,twitter_rel_freq:0.0001311356648428281,wikipedia_rel_freq:0.0000472759077330852},零:{jlpt_level:2,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000030245151228281426,news_rel_freq:0.0000169597406768429,twitter_rel_freq:0.000012094066650901068,wikipedia_rel_freq:0.00003302468979979611},幼:{jlpt_level:2,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00014137714235030972,news_rel_freq:0.00006163654325984048,twitter_rel_freq:0.00011234488360010578,wikipedia_rel_freq:0.0002036467305315563},荷:{jlpt_level:2,joyo_grade:3,frequency:1500,nhk_rel_freq:0.00020870489128372482,aozora_rel_freq:0.00021692203196288935,news_rel_freq:0.00008751226189250936,twitter_rel_freq:0.00028675931587962946,wikipedia_rel_freq:0.00009792821080695233},泊:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0003035707509581452,aozora_rel_freq:0.00018834745427708202,news_rel_freq:0.0001105775092130157,twitter_rel_freq:0.0002839606888860325,wikipedia_rel_freq:0.00005838652992470321},黄:{jlpt_level:2,joyo_grade:2,frequency:1500,nhk_rel_freq:0.0001960561099938021,aozora_rel_freq:0.0003072107043514905,news_rel_freq:0.00008508944179581751,twitter_rel_freq:0.00021979216996141694,wikipedia_rel_freq:0.00019466595228650175},甘:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.00015701448771881745,news_rel_freq:0.00007636728944772688,twitter_rel_freq:0.0002600724084764015,wikipedia_rel_freq:0.000054613736338929514},臣:{jlpt_level:2,joyo_grade:4,frequency:1500,nhk_rel_freq:0.000423734173212411,aozora_rel_freq:0.00021888398461160895,news_rel_freq:0.00007394446935103504,twitter_rel_freq:0.00004477803189755106,wikipedia_rel_freq:0.00027657253627819215},浅:{jlpt_level:2,joyo_grade:4,frequency:1500,nhk_rel_freq:0.00017708293805891801,aozora_rel_freq:0.00022424536016652587,news_rel_freq:0.0001610690800280737,twitter_rel_freq:0.00013513370340510945,wikipedia_rel_freq:0.00016632411506580446},掃:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00017708293805891801,aozora_rel_freq:0.00008181925303373242,news_rel_freq:0.00005368969334269123,twitter_rel_freq:0.00015242522018697627,wikipedia_rel_freq:0.00004216479209830394},雲:{jlpt_level:2,joyo_grade:2,frequency:1500,nhk_rel_freq:0.00023400245386357023,aozora_rel_freq:0.00044514957324810354,news_rel_freq:0.00008082527842563987,twitter_rel_freq:0.0001908063903848772,wikipedia_rel_freq:0.00018631992107040506},掘:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.0001128608404857515,news_rel_freq:0.00006105506643663444,twitter_rel_freq:0.00004197940490395412,wikipedia_rel_freq:0.00006014419288239981},捨:{jlpt_level:2,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00017075854741395666,aozora_rel_freq:0.00025435453447855943,news_rel_freq:0.00003963733678187855,twitter_rel_freq:0.00017711310830906358,wikipedia_rel_freq:0.00005121949670416081},軟:{jlpt_level:2,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00002754503817707326,news_rel_freq:0.000045645930621674314,twitter_rel_freq:0.00003108474982173746,wikipedia_rel_freq:0.00003497481621406427},沈:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00017075854741395666,aozora_rel_freq:0.00026521326250464116,news_rel_freq:0.00007917776075988941,twitter_rel_freq:0.00005787160818902247,wikipedia_rel_freq:0.0000770567598045725},凍:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00008854146902945901,aozora_rel_freq:0.00004945674696673379,news_rel_freq:0.00006095815363276676,twitter_rel_freq:0.00005147474648937231,wikipedia_rel_freq:0.000028835104490188628},乳:{jlpt_level:2,joyo_grade:6,frequency:1500,nhk_rel_freq:0.0002403268445085316,aozora_rel_freq:0.00015336253625387403,news_rel_freq:0.00006493157859134139,twitter_rel_freq:0.00019200580195356158,wikipedia_rel_freq:0.00010081261347067053},恋:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.000377083414029158,news_rel_freq:0.00005494955979297099,twitter_rel_freq:0.00036791949869394077,wikipedia_rel_freq:0.00027119375623360935},紅:{jlpt_level:2,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00008854146902945901,aozora_rel_freq:0.00026375636697341376,news_rel_freq:0.00004729344828742477,twitter_rel_freq:0.00008915625993887399,wikipedia_rel_freq:0.0001176219384062055},郊:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.0000410456034331141,news_rel_freq:0.000073362992527829,twitter_rel_freq:0.000005597253987193882,wikipedia_rel_freq:0.000051214398334450305},腰:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.0003752574382966863,news_rel_freq:0.000047487273895160114,twitter_rel_freq:0.0001849092835055122,wikipedia_rel_freq:0.00003329235420959762},炭:{jlpt_level:2,joyo_grade:3,frequency:1500,nhk_rel_freq:0.00023400245386357023,aozora_rel_freq:0.00009333844036730395,news_rel_freq:0.00006221802008304652,twitter_rel_freq:0.00007996077124562689,wikipedia_rel_freq:0.00008923803963539657},踊:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00020870489128372482,aozora_rel_freq:0.00017092298372360198,news_rel_freq:0.00004835948912996918,twitter_rel_freq:0.00015242522018697627,wikipedia_rel_freq:0.00006404444571093613},冊:{jlpt_level:2,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00008854146902945901,aozora_rel_freq:0.00008059546078750137,news_rel_freq:0.00002820162592549305,twitter_rel_freq:0.000035582543204303965,wikipedia_rel_freq:0.00006961314002723521},勇:{jlpt_level:2,joyo_grade:4,frequency:1500,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.00024149500325625864,news_rel_freq:0.00009604058863286464,twitter_rel_freq:0.00011224493263604876,wikipedia_rel_freq:0.00012381135923475857},械:{jlpt_level:2,joyo_grade:4,frequency:1500,nhk_rel_freq:0.0011194171441581604,aozora_rel_freq:0.00013294657354294032,news_rel_freq:0.000032853440511141384,twitter_rel_freq:0.00004097989526338379,wikipedia_rel_freq:0.00009481055772897853},菜:{jlpt_level:2,joyo_grade:4,frequency:1500,nhk_rel_freq:0.00033519270418295197,aozora_rel_freq:0.00009994303344220163,news_rel_freq:0.0001124188524865015,twitter_rel_freq:0.00032454078029318814,wikipedia_rel_freq:0.00011589996403648243},珍:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00018340732870387937,aozora_rel_freq:0.0002071899698142901,news_rel_freq:0.00004516136660233595,twitter_rel_freq:0.00012493870507129202,wikipedia_rel_freq:0.00005733116739462867},卵:{jlpt_level:2,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00021502928192868617,aozora_rel_freq:0.000057013178455366726,news_rel_freq:0.00006861426513831299,twitter_rel_freq:0.00009645268031503744,wikipedia_rel_freq:0.000052466048098379286},湖:{jlpt_level:2,joyo_grade:3,frequency:1500,nhk_rel_freq:0.00021502928192868617,aozora_rel_freq:0.00012542899260180678,news_rel_freq:0.00008877212834278911,twitter_rel_freq:0.00013243502737556953,wikipedia_rel_freq:0.00019635223806825126},喫:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00006117018703780232,news_rel_freq:0.00007452594617424108,twitter_rel_freq:0.00011974125494032627,wikipedia_rel_freq:0.00004719051004043424},干:{jlpt_level:2,joyo_grade:6,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00014656369044147935,news_rel_freq:0.000046808884268086403,twitter_rel_freq:0.00016701806093930317,wikipedia_rel_freq:0.00007820516758186375},虫:{jlpt_level:2,joyo_grade:1,frequency:1500,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.0002364444320813369,news_rel_freq:0.00004516136660233595,twitter_rel_freq:0.0001674178647955313,wikipedia_rel_freq:0.00012183574097193787},刷:{jlpt_level:2,joyo_grade:4,frequency:1500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.0003035199023390477,news_rel_freq:0.00003750525509678972,twitter_rel_freq:0.000022988721733117732,wikipedia_rel_freq:0.00006235943452161422},湯:{jlpt_level:2,joyo_grade:3,frequency:1500,nhk_rel_freq:0.0002719487977333384,aozora_rel_freq:0.0002853572713830791,news_rel_freq:0.000128603290732403,twitter_rel_freq:0.00020799795620268696,wikipedia_rel_freq:0.00013390995503884134},溶:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.000042463648416842134,news_rel_freq:0.00003081827162992024,twitter_rel_freq:0.000045677590574064366,wikipedia_rel_freq:0.000056270706494843634},鉱:{jlpt_level:2,joyo_grade:5,frequency:1500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00003381940159822605,news_rel_freq:0.00003256270209953836,twitter_rel_freq:0.000006296910735593118,wikipedia_rel_freq:0.00009510881235704307},涙:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00032323655519499227,news_rel_freq:0.00004264163370177643,twitter_rel_freq:0.00023598422613865637,wikipedia_rel_freq:0.00004685911600925141},匹:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0003035707509581452,aozora_rel_freq:0.00010040924001219441,news_rel_freq:0.00007423520776263806,twitter_rel_freq:0.00008725719162179034,wikipedia_rel_freq:0.0000316646996795189},孫:{jlpt_level:2,joyo_grade:4,frequency:1500,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.00014532047292149862,news_rel_freq:0.000049231704364778245,twitter_rel_freq:0.000050375285884744945,wikipedia_rel_freq:0.00012454807365792653},鋭:{jlpt_level:2,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00013828852382410757,news_rel_freq:0.00003256270209953836,twitter_rel_freq:0.000011094557010330732,wikipedia_rel_freq:0.00002817231642782298},枝:{jlpt_level:2,joyo_grade:5,frequency:1500,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00033588240840604636,news_rel_freq:0.000091776425262687,twitter_rel_freq:0.00005497303023136849,wikipedia_rel_freq:0.0001108041435108327},塗:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.0001149781953244687,news_rel_freq:0.00003527626060783323,twitter_rel_freq:0.00010354919876308683,wikipedia_rel_freq:0.00005862232952381407},軒:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.0002728085445407735,news_rel_freq:0.000033338004530479756,twitter_rel_freq:0.00010045071887731879,wikipedia_rel_freq:0.000048507164018172154},毒:{jlpt_level:2,joyo_grade:4,frequency:1500,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.00030157737496407783,news_rel_freq:0.0000578569439090012,twitter_rel_freq:0.00011484365770153164,wikipedia_rel_freq:0.00007462228826780637},叫:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00034108838177096567,news_rel_freq:0.000021999206477961933,twitter_rel_freq:0.00011144532492359248,wikipedia_rel_freq:0.000023542996730684444},拝:{jlpt_level:2,joyo_grade:6,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00016328885113997026,news_rel_freq:0.00008198823207205195,twitter_rel_freq:0.00007066533158832277,wikipedia_rel_freq:0.0000601148772565644},氷:{jlpt_level:2,joyo_grade:3,frequency:1500,nhk_rel_freq:0.0003035707509581452,aozora_rel_freq:0.00012370014323808358,news_rel_freq:0.00007462285897810875,twitter_rel_freq:0.00008495831944847857,wikipedia_rel_freq:0.0001022529029138882},乾:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.00012630312992054324,news_rel_freq:0.0000449675409946006,twitter_rel_freq:0.0002860596591312302,wikipedia_rel_freq:0.000051385193719752225},棒:{jlpt_level:2,joyo_grade:6,frequency:1500,nhk_rel_freq:0.0001201634222542658,aozora_rel_freq:0.00019837089553192673,news_rel_freq:0.00003411330696142114,twitter_rel_freq:0.00011444385384530349,wikipedia_rel_freq:0.00006676315135906292},祈:{jlpt_level:2,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000600817111271329,aozora_rel_freq:0.00012741037052427608,news_rel_freq:0.00008373266254167008,twitter_rel_freq:0.00011614302023427307,wikipedia_rel_freq:0.000034333696222968266},拾:{jlpt_level:2,joyo_grade:3,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00013261634388919545,news_rel_freq:0.000018122694323254985,twitter_rel_freq:0.00006886621423529616,wikipedia_rel_freq:0.00002578245562602376},粉:{jlpt_level:2,joyo_grade:4,frequency:1500,nhk_rel_freq:0.00021502928192868617,aozora_rel_freq:0.00012830393311676224,news_rel_freq:0.00003498552219623021,twitter_rel_freq:0.00007296420376163455,wikipedia_rel_freq:0.000046601648338870915},糸:{jlpt_level:2,joyo_grade:1,frequency:1500,nhk_rel_freq:0.00014546098483411124,aozora_rel_freq:0.0001830055039959148,news_rel_freq:0.0000637686249449293,twitter_rel_freq:0.0000811601828143113,wikipedia_rel_freq:0.00006914281542144113},綿:{jlpt_level:2,joyo_grade:5,frequency:1500,aozora_rel_freq:0.0000884821219298792,news_rel_freq:0.000022289944889564954,twitter_rel_freq:0.000023588427517459935,wikipedia_rel_freq:0.000025289188356532406},汗:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00012608945190929657,news_rel_freq:0.0000316904868647293,twitter_rel_freq:0.0002018009964311509,wikipedia_rel_freq:0.000014387599323045098},銅:{jlpt_level:2,joyo_grade:5,frequency:2000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00007962419710001642,news_rel_freq:0.00008605856983449426,twitter_rel_freq:0.000007596273268334555,wikipedia_rel_freq:0.00007757042055290589},湿:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00009486585967442038,aozora_rel_freq:0.00004594077241803826,news_rel_freq:0.00002742632349455166,twitter_rel_freq:0.0003311375439209524,wikipedia_rel_freq:0.000029499167144981903},瓶:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00007915799053002365,news_rel_freq:0.000017347391892313592,twitter_rel_freq:0.000023388525589345867,wikipedia_rel_freq:0.000025697057933372805},咲:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00043005856385737234,aozora_rel_freq:0.00017541022195978245,news_rel_freq:0.00006260567129851721,twitter_rel_freq:0.00013403424280048208,wikipedia_rel_freq:0.00008503825758636807},召:{jlpt_level:2,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00015922896892628315,news_rel_freq:0.00001201718767959154,twitter_rel_freq:0.000030285142109281186,wikipedia_rel_freq:0.000042536973087170806},缶:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.000017987803492221324,news_rel_freq:0.000022580683301167974,twitter_rel_freq:0.00006286915639187415,wikipedia_rel_freq:0.000022515675234017687},隻:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.000023873661438380138,news_rel_freq:0.00004477371538686525,twitter_rel_freq:0.000008995586765133026,wikipedia_rel_freq:0.00006371815004946381},脂:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00004349318792557618,news_rel_freq:0.000021223904047020543,twitter_rel_freq:0.00005297401095022782,wikipedia_rel_freq:0.00003777509577755914},蒸:{jlpt_level:2,joyo_grade:6,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00006911512400142923,news_rel_freq:0.00003256270209953836,twitter_rel_freq:0.000068366459415011,wikipedia_rel_freq:0.00007665526318987024},肌:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00009803935661473113,news_rel_freq:0.000023937462555315405,twitter_rel_freq:0.0001522253182588622,wikipedia_rel_freq:0.000020573196374315285},耕:{jlpt_level:2,joyo_grade:5,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.000055595133471638695,news_rel_freq:0.0000339194813536858,twitter_rel_freq:0.000011194507974387765,wikipedia_rel_freq:0.00005100409058389198},鈍:{jlpt_level:2,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00006132558922779991,news_rel_freq:0.00002713558508294864,twitter_rel_freq:0.00002098970245197706,wikipedia_rel_freq:0.000008463293719438293},泥:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00016785379047114954,news_rel_freq:0.00001725047908844592,twitter_rel_freq:0.00004967562913634571,wikipedia_rel_freq:0.00003005871322070983},隅:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00020870514116676665,news_rel_freq:0.00001569987422656314,twitter_rel_freq:0.00001959038895517859,wikipedia_rel_freq:0.000030692185657240073},灯:{jlpt_level:2,joyo_grade:4,frequency:2000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.0002467398271686774,news_rel_freq:0.00006095815363276676,twitter_rel_freq:0.0001567231116414287,wikipedia_rel_freq:0.00008924568718996233},辛:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00015852965907129399,news_rel_freq:0.00001938256077353474,twitter_rel_freq:0.0005630237805332703,wikipedia_rel_freq:0.00003885849934104145},磨:{jlpt_level:2,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00008920085705861806,news_rel_freq:0.00004147868005536435,twitter_rel_freq:0.0000930543475370983,wikipedia_rel_freq:0.00006778537448601917},麦:{jlpt_level:2,joyo_grade:2,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00011241405918950842,news_rel_freq:0.00001618443824590151,twitter_rel_freq:0.00010474861033177123,wikipedia_rel_freq:0.00005095820525649743},姓:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00019353400236825168,news_rel_freq:0.000008722152348090634,twitter_rel_freq:0.000005197450130965748,wikipedia_rel_freq:0.00009025516439264232},筒:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00007707948623880585,news_rel_freq:0.000039152772762540176,twitter_rel_freq:0.000031684455606079655,wikipedia_rel_freq:0.00008259741308746381},鼻:{jlpt_level:2,joyo_grade:3,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00031183391950391894,news_rel_freq:0.000019770211989005436,twitter_rel_freq:0.00024088182337745102,wikipedia_rel_freq:0.00004244647702480934},粒:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.00006012122225531857,news_rel_freq:0.000016669002265239878,twitter_rel_freq:0.000021389506308205195,wikipedia_rel_freq:0.00004418119731880867},詞:{jlpt_level:2,joyo_grade:6,frequency:2000,aozora_rel_freq:0.00015501368452259845,news_rel_freq:0.0000206424272238145,twitter_rel_freq:0.000095153317782296,wikipedia_rel_freq:0.0004695725962617864},胃:{jlpt_level:2,joyo_grade:4,frequency:2000,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00004366801538932347,news_rel_freq:0.00001628135104976918,twitter_rel_freq:0.00011484365770153164,wikipedia_rel_freq:0.000015160002334186605},畳:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00018110182716844428,news_rel_freq:0.000015506048618827792,twitter_rel_freq:0.000020489947631691894,wikipedia_rel_freq:0.0000172477847306384},机:{jlpt_level:2,joyo_grade:6,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00016668827404616758,news_rel_freq:0.000010854234033179454,twitter_rel_freq:0.000042579110688296324,wikipedia_rel_freq:0.0000072983162405879015},膚:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00010751464096434309,aozora_rel_freq:0.00006179179579779269,news_rel_freq:0.000011726449267988518,twitter_rel_freq:0.000023088672697174765,wikipedia_rel_freq:0.00002116588185316149},濯:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.000028011244747066035,news_rel_freq:0.000011048059640914803,twitter_rel_freq:0.00011944140204815518,wikipedia_rel_freq:0.00000721036936308169},塔:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.00012158278839936638,news_rel_freq:0.00003973424958574622,twitter_rel_freq:0.000026287103546999843,wikipedia_rel_freq:0.0001035402412657907},沸:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00003523744658195408,news_rel_freq:0.000019964037596740785,twitter_rel_freq:0.000026986760295399076,wikipedia_rel_freq:0.00001169566011589846},灰:{jlpt_level:2,joyo_grade:6,frequency:2000,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.00012043669724813413,news_rel_freq:0.000036729952665848335,twitter_rel_freq:0.00002268886884094663,wikipedia_rel_freq:0.000045992393158465564},菓:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.0001517853754790726,aozora_rel_freq:0.0000861316638061656,news_rel_freq:0.000046227407444880355,twitter_rel_freq:0.00015242522018697627,wikipedia_rel_freq:0.00005187973558167121},帽:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00016546448179993655,news_rel_freq:0.000021611555262491236,twitter_rel_freq:0.00006846641037906803,wikipedia_rel_freq:0.00002834948477526303},枯:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00011979566321439406,news_rel_freq:0.000010854234033179454,twitter_rel_freq:0.00002178931016443333,wikipedia_rel_freq:0.000014659087510129488},涼:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00008789936371738822,news_rel_freq:0.000027620149102287005,twitter_rel_freq:0.00017061629564535638,wikipedia_rel_freq:0.00005637012470419848},舟:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00018929929269081728,news_rel_freq:0.000014536920580151056,twitter_rel_freq:0.000016192056177239445,wikipedia_rel_freq:0.000047984581122845394},貝:{jlpt_level:2,joyo_grade:1,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00007074684699640395,news_rel_freq:0.000039831162389613894,twitter_rel_freq:0.000035182739348075834,wikipedia_rel_freq:0.000050722405657386574},符:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00009800050606723172,news_rel_freq:0.000024615852182389122,twitter_rel_freq:0.00003328367103099219,wikipedia_rel_freq:0.00005467364218302795},憎:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0001887748102995754,news_rel_freq:0.000014827658991754077,twitter_rel_freq:0.00002758646607974128,wikipedia_rel_freq:0.000017766543848682284},皿:{jlpt_level:2,joyo_grade:3,frequency:2000,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.0000883461450136313,news_rel_freq:0.000015215310207224771,twitter_rel_freq:0.00006846641037906803,wikipedia_rel_freq:0.000013536171581390764},肯:{jlpt_level:2,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0000638508748152608,news_rel_freq:0.000005814768232060422,twitter_rel_freq:0.000005597253987193882,wikipedia_rel_freq:0.000008223670343044558},燥:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000022455616454652106,news_rel_freq:0.000011338798052517823,twitter_rel_freq:0.00019040658652864903,wikipedia_rel_freq:0.000019006722280762625},畜:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00007698235987005735,news_rel_freq:0.000012889402914400603,twitter_rel_freq:0.00005437332444702629,wikipedia_rel_freq:0.000024979462396619227},挟:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.00003177974785450765,news_rel_freq:0.0000357608246271716,twitter_rel_freq:0.00003848112116195794,wikipedia_rel_freq:0.00003101975591114002},曇:{jlpt_level:2,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00009462050843478409,news_rel_freq:0.00034006702877166706,twitter_rel_freq:0.0005196450621325178,wikipedia_rel_freq:0.000015555125986750742},滴:{jlpt_level:2,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000050952493045460615,news_rel_freq:0.0000051363786049867065,twitter_rel_freq:0.00002868592668436865,wikipedia_rel_freq:0.00000827720322500486},伺:{jlpt_level:2,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00007492328085258925,news_rel_freq:0.0000028104713121625373,twitter_rel_freq:0.000019190585098950454,wikipedia_rel_freq:0.000011125917300749527},氏:{jlpt_level:1,joyo_grade:4,frequency:500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.001001450562891985,news_rel_freq:0.0021151219444119785,twitter_rel_freq:0.0004417832611320886,wikipedia_rel_freq:0.0006441815621071615},統:{jlpt_level:1,joyo_grade:5,frequency:500,nhk_rel_freq:0.001113092753513199,aozora_rel_freq:0.0002687292370533367,news_rel_freq:0.0009413140639667147,twitter_rel_freq:0.0001400313006439041,wikipedia_rel_freq:0.0008996111591958894},保:{jlpt_level:1,joyo_grade:5,frequency:500,nhk_rel_freq:0.0006767097990108653,aozora_rel_freq:0.0004008599490987897,news_rel_freq:0.001609237108222722,twitter_rel_freq:0.0006470825413052357,wikipedia_rel_freq:0.0012568526502185467},第:{jlpt_level:1,joyo_grade:3,frequency:500,nhk_rel_freq:0.0003794634386976815,aozora_rel_freq:0.0020939668091225594,news_rel_freq:0.0021115361706688747,twitter_rel_freq:0.0008783690721332115,wikipedia_rel_freq:0.003900503923244564},結:{jlpt_level:1,joyo_grade:4,frequency:500,nhk_rel_freq:0.0009043878622294742,aozora_rel_freq:0.0010911176265205958,news_rel_freq:0.0009758150221436066,twitter_rel_freq:0.0015227529374089073,wikipedia_rel_freq:0.0011588836524539104},派:{jlpt_level:1,joyo_grade:6,frequency:500,nhk_rel_freq:0.0001517853754790726,aozora_rel_freq:0.0004312216519695693,news_rel_freq:0.0007814079375850531,twitter_rel_freq:0.00021299550440553863,wikipedia_rel_freq:0.0004544393603685799},案:{jlpt_level:1,joyo_grade:4,frequency:500,nhk_rel_freq:0.0004110853919224883,aozora_rel_freq:0.00038986524415646,news_rel_freq:0.0009840526104723589,twitter_rel_freq:0.00029625465746504765,wikipedia_rel_freq:0.0003731305602254462},策:{jlpt_level:1,joyo_grade:6,frequency:500,nhk_rel_freq:0.00011383903160930444,aozora_rel_freq:0.00015066242320266587,news_rel_freq:0.0009431554072402005,twitter_rel_freq:0.00012373929350260762,wikipedia_rel_freq:0.00025512242031367},基:{jlpt_level:1,joyo_grade:5,frequency:500,nhk_rel_freq:0.0002909219696682225,aozora_rel_freq:0.00020237250192436473,news_rel_freq:0.0008155212445464743,twitter_rel_freq:0.0002679685346369071,wikipedia_rel_freq:0.000946149077913379},価:{jlpt_level:1,joyo_grade:5,frequency:500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.0003123584018951608,news_rel_freq:0.0009142753916876337,twitter_rel_freq:0.0004414834082399175,wikipedia_rel_freq:0.00032741347903134793},提:{jlpt_level:1,joyo_grade:5,frequency:500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.0002239734063340301,news_rel_freq:0.0009374375518120078,twitter_rel_freq:0.00016701806093930317,wikipedia_rel_freq:0.0005937484889308461},挙:{jlpt_level:1,joyo_grade:4,frequency:500,nhk_rel_freq:0.0004616805170821791,aozora_rel_freq:0.00023118018289516843,news_rel_freq:0.0007842184088972156,twitter_rel_freq:0.00025727378148280455,wikipedia_rel_freq:0.00048280286566054683},応:{jlpt_level:1,joyo_grade:5,frequency:500,nhk_rel_freq:0.00023400245386357023,aozora_rel_freq:0.00036643836401432293,news_rel_freq:0.0008469209929996005,twitter_rel_freq:0.0010743729126490543,wikipedia_rel_freq:0.0005612909927613436},企:{jlpt_level:1,joyo_grade:9,frequency:500,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00007981844983751342,news_rel_freq:0.00065697189741896,twitter_rel_freq:0.00015232526922291924,wikipedia_rel_freq:0.0005604905487167943},検:{jlpt_level:1,joyo_grade:5,frequency:500,nhk_rel_freq:0.0004869780796620246,aozora_rel_freq:0.00018036366676595572,news_rel_freq:0.0012104409203072446,twitter_rel_freq:0.00039560591573773905,wikipedia_rel_freq:0.0004134535662658303},藤:{jlpt_level:1,joyo_grade:9,frequency:500,nhk_rel_freq:0.0003604902667627974,aozora_rel_freq:0.0005297077898805435,news_rel_freq:0.0010677852730140288,twitter_rel_freq:0.0006517802366159162,wikipedia_rel_freq:0.0011717532121956527},沢:{jlpt_level:1,joyo_grade:9,frequency:500,nhk_rel_freq:0.000265624407088377,aozora_rel_freq:0.00044460566558311194,news_rel_freq:0.0004905726131781643,twitter_rel_freq:0.00076992227613133,wikipedia_rel_freq:0.0006092946927706034},裁:{jlpt_level:1,joyo_grade:6,frequency:500,nhk_rel_freq:0.0004490317357922564,aozora_rel_freq:0.0001359574909741437,news_rel_freq:0.0009956821469364796,twitter_rel_freq:0.00005657224565628103,wikipedia_rel_freq:0.0002603240320108127},証:{jlpt_level:1,joyo_grade:5,frequency:500,nhk_rel_freq:0.00018340732870387937,aozora_rel_freq:0.00034569217164964435,news_rel_freq:0.0006002779071563709,twitter_rel_freq:0.00017741296120123468,wikipedia_rel_freq:0.00032953949920062854},援:{jlpt_level:1,joyo_grade:9,frequency:500,nhk_rel_freq:0.0004110853919224883,aozora_rel_freq:0.00005240938857668805,news_rel_freq:0.0008246310481100355,twitter_rel_freq:0.0007034548850334026,wikipedia_rel_freq:0.00026722467541398124},施:{jlpt_level:1,joyo_grade:9,frequency:500,nhk_rel_freq:0.00017075854741395666,aozora_rel_freq:0.00007610822255132089,news_rel_freq:0.0009242574104860042,twitter_rel_freq:0.00011154527588764952,wikipedia_rel_freq:0.0006582836527264182},井:{jlpt_level:1,joyo_grade:9,frequency:500,nhk_rel_freq:0.0007146561428806335,aozora_rel_freq:0.0006078750914493325,news_rel_freq:0.001005373427323247,twitter_rel_freq:0.0007995077614922119,wikipedia_rel_freq:0.0012550975364457055},護:{jlpt_level:1,joyo_grade:5,frequency:500,nhk_rel_freq:0.0005628707674015608,aozora_rel_freq:0.00025996843859222245,news_rel_freq:0.0006820723136206875,twitter_rel_freq:0.00018331006808059965,wikipedia_rel_freq:0.00047857376798568296},展:{jlpt_level:1,joyo_grade:6,frequency:500,nhk_rel_freq:0.00044270734514729505,aozora_rel_freq:0.00019868169991192194,news_rel_freq:0.0004983256374875782,twitter_rel_freq:0.0002847602965984888,wikipedia_rel_freq:0.00038762012694270145},態:{jlpt_level:1,joyo_grade:5,frequency:500,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.0005467631802327792,news_rel_freq:0.0005492048595181069,twitter_rel_freq:0.0003793139085964426,wikipedia_rel_freq:0.0004420363014553489},鮮:{jlpt_level:1,joyo_grade:9,frequency:500,nhk_rel_freq:0.0005186000328868313,aozora_rel_freq:0.00014804001124645648,news_rel_freq:0.0004198262663547625,twitter_rel_freq:0.00015362463175566066,wikipedia_rel_freq:0.00019389354927536024},視:{jlpt_level:1,joyo_grade:6,frequency:500,nhk_rel_freq:0.00015810976612403395,aozora_rel_freq:0.0003329880426173412,news_rel_freq:0.0006956401061621618,twitter_rel_freq:0.00031564514449211215,wikipedia_rel_freq:0.00035199909236783064},条:{jlpt_level:1,joyo_grade:5,frequency:500,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00031175621840892013,news_rel_freq:0.00036662113703140963,twitter_rel_freq:0.0004322879195466704,wikipedia_rel_freq:0.0006139495043162945},幹:{jlpt_level:1,joyo_grade:5,frequency:500,nhk_rel_freq:0.0008158463932000151,aozora_rel_freq:0.00006958133057142201,news_rel_freq:0.0005640325185098609,twitter_rel_freq:0.0002053992311372041,wikipedia_rel_freq:0.00019345254029540156},独:{jlpt_level:1,joyo_grade:5,frequency:500,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.0004452661248906017,news_rel_freq:0.0003952104141723734,twitter_rel_freq:0.00017551389288415103,wikipedia_rel_freq:0.0005104678943021745},宮:{jlpt_level:1,joyo_grade:3,frequency:500,nhk_rel_freq:0.0007715756586852857,aozora_rel_freq:0.0005941414229082953,news_rel_freq:0.0010947270324892422,twitter_rel_freq:0.0011577320166726204,wikipedia_rel_freq:0.0010355859539674852},率:{jlpt_level:1,joyo_grade:5,frequency:500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00012051439834313293,news_rel_freq:0.0006794556679162603,twitter_rel_freq:0.0006278919562062852,wikipedia_rel_freq:0.00040987705991391097},衛:{jlpt_level:1,joyo_grade:5,frequency:500,nhk_rel_freq:0.00041740978256744963,aozora_rel_freq:0.0005834380970722111,news_rel_freq:0.0007135689748776815,twitter_rel_freq:0.000190306635564592,wikipedia_rel_freq:0.0005810892369396621},張:{jlpt_level:1,joyo_grade:5,frequency:500,nhk_rel_freq:0.0005691951580465223,aozora_rel_freq:0.000801875300387577,news_rel_freq:0.0005493017723219746,twitter_rel_freq:0.003365149057872208,wikipedia_rel_freq:0.00040556893750853427},監:{jlpt_level:1,joyo_grade:9,frequency:500,nhk_rel_freq:0.00035416587611783603,aozora_rel_freq:0.00013077094288297403,news_rel_freq:0.0008370358870050978,twitter_rel_freq:0.0001561234058570865,wikipedia_rel_freq:0.0007913166881750528},環:{jlpt_level:1,joyo_grade:9,frequency:500,nhk_rel_freq:0.00033519270418295197,aozora_rel_freq:0.00008881235158362407,news_rel_freq:0.0003674933522662187,twitter_rel_freq:0.00012004110783249738,wikipedia_rel_freq:0.0003290181908977294},審:{jlpt_level:1,joyo_grade:9,frequency:500,nhk_rel_freq:0.00013913659418914989,aozora_rel_freq:0.00009417372713854101,news_rel_freq:0.0006066741522116374,twitter_rel_freq:0.00010095047369760396,wikipedia_rel_freq:0.00020731118376098175},義:{jlpt_level:1,joyo_grade:5,frequency:500,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.001059668108319833,news_rel_freq:0.0004587852135095673,twitter_rel_freq:0.000234884765534029,wikipedia_rel_freq:0.0009830051925506197},訴:{jlpt_level:1,joyo_grade:9,frequency:500,nhk_rel_freq:0.00011383903160930444,aozora_rel_freq:0.00011210325480951325,news_rel_freq:0.0008470179058034682,twitter_rel_freq:0.00003668200380893134,wikipedia_rel_freq:0.00010986349429924452},株:{jlpt_level:1,joyo_grade:6,frequency:500,nhk_rel_freq:0.00021502928192868617,aozora_rel_freq:0.00004904881621799011,news_rel_freq:0.00106982044189525,twitter_rel_freq:0.00008945611283104509,wikipedia_rel_freq:0.0005925796876747127},姿:{jlpt_level:1,joyo_grade:6,frequency:500,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.0007797887641341691,news_rel_freq:0.00044105017040178303,twitter_rel_freq:0.0001760136477044362,wikipedia_rel_freq:0.0002030400245360062},閣:{jlpt_level:1,joyo_grade:6,frequency:500,nhk_rel_freq:0.00009486585967442038,aozora_rel_freq:0.0001290615187930005,news_rel_freq:0.0004607234695869208,twitter_rel_freq:0.00004717685503491987,wikipedia_rel_freq:0.00020358045172531972},衆:{jlpt_level:1,joyo_grade:6,frequency:500,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.0003758401965091773,news_rel_freq:0.0004286453315067208,twitter_rel_freq:0.00005017538395663088,wikipedia_rel_freq:0.0006275481309266389},評:{jlpt_level:1,joyo_grade:5,frequency:500,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00039784903166758634,news_rel_freq:0.0003129314436887184,twitter_rel_freq:0.00016701806093930317,wikipedia_rel_freq:0.00035058684395802077},影:{jlpt_level:1,joyo_grade:9,frequency:500,nhk_rel_freq:0.0001644341567689953,aozora_rel_freq:0.0005637991453112653,news_rel_freq:0.0011299063802932077,twitter_rel_freq:0.0003675196948377126,wikipedia_rel_freq:0.0006720352304280778},松:{jlpt_level:1,joyo_grade:4,frequency:500,nhk_rel_freq:0.00027827318837829977,aozora_rel_freq:0.000704923759102829,news_rel_freq:0.0008594227446985305,twitter_rel_freq:0.0009203484770371656,wikipedia_rel_freq:0.001154632886707777},撃:{jlpt_level:1,joyo_grade:9,frequency:500,nhk_rel_freq:0.0006261146738511744,aozora_rel_freq:0.0002117743344192191,news_rel_freq:0.0006656940497670507,twitter_rel_freq:0.00030345112687715407,wikipedia_rel_freq:0.0007304000922815114},佐:{jlpt_level:1,joyo_grade:9,frequency:500,nhk_rel_freq:0.00022767806321860888,aozora_rel_freq:0.00034615837821963714,news_rel_freq:0.0005433900912860465,twitter_rel_freq:0.0004679704137150314,wikipedia_rel_freq:0.0008045074452085567},核:{jlpt_level:1,joyo_grade:9,frequency:500,nhk_rel_freq:0.00025930001644341565,aozora_rel_freq:0.000027195383249578675,news_rel_freq:0.000266122559420632,twitter_rel_freq:0.00001819107545838012,wikipedia_rel_freq:0.00012735600077598718},整:{jlpt_level:1,joyo_grade:3,frequency:500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.0001150753216932172,news_rel_freq:0.000568490507487774,twitter_rel_freq:0.00023968241180876663,wikipedia_rel_freq:0.0002917274402426682},融:{jlpt_level:1,joyo_grade:9,frequency:500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00004392054394806956,news_rel_freq:0.00028724955066378486,twitter_rel_freq:0.000025587446798600607,wikipedia_rel_freq:0.00013363846685175696},製:{jlpt_level:1,joyo_grade:5,frequency:500,nhk_rel_freq:0.0006387634551410971,aozora_rel_freq:0.00017993631074346233,news_rel_freq:0.00048621153700411897,twitter_rel_freq:0.00020819785813080104,wikipedia_rel_freq:0.00098444930577112},票:{jlpt_level:1,joyo_grade:4,frequency:500,nhk_rel_freq:0.0004933024703069859,aozora_rel_freq:0.00001212137081981221,news_rel_freq:0.0005615127856093015,twitter_rel_freq:0.00015972164056313973,wikipedia_rel_freq:0.00035718413436341425},渉:{jlpt_level:1,joyo_grade:9,frequency:500,aozora_rel_freq:0.00007744856644005013,news_rel_freq:0.0002849236433709607,twitter_rel_freq:0.000024487986193973237,wikipedia_rel_freq:0.0000651788329715235},響:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00015810976612403395,aozora_rel_freq:0.00031700104232133884,news_rel_freq:0.0005664553386065528,twitter_rel_freq:0.00016701806093930317,wikipedia_rel_freq:0.00035017132682661463},推:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00018601642142711814,news_rel_freq:0.0006589101534963135,twitter_rel_freq:0.00018201070554785823,wikipedia_rel_freq:0.00030482897580623843},請:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00009730119621224256,news_rel_freq:0.0004293237211337945,twitter_rel_freq:0.00006506807760112889,wikipedia_rel_freq:0.00013041374800986253},器:{jlpt_level:1,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00051227564224187,aozora_rel_freq:0.00034613895294588747,news_rel_freq:0.0003990869263270803,twitter_rel_freq:0.00026357069221839765,wikipedia_rel_freq:0.0006037081541603175},士:{jlpt_level:1,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0010498488470635854,aozora_rel_freq:0.0011489078159259505,news_rel_freq:0.0007403169087451594,twitter_rel_freq:0.0011926149031285251,wikipedia_rel_freq:0.0010639596559988732},討:{jlpt_level:1,joyo_grade:6,frequency:1000,aozora_rel_freq:0.00013063496596672615,news_rel_freq:0.000491251002805238,twitter_rel_freq:0.00005357371673457002,wikipedia_rel_freq:0.00012417844185391494},攻:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0003478414854728747,aozora_rel_freq:0.00010443027167838212,news_rel_freq:0.0003844530929430616,twitter_rel_freq:0.0004684701685353166,wikipedia_rel_freq:0.00047294644241771305},崎:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000600817111271329,aozora_rel_freq:0.00019994434270565237,news_rel_freq:0.000944512186494348,twitter_rel_freq:0.0010062063551621574,wikipedia_rel_freq:0.0009368547499311284},督:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0003478414854728747,aozora_rel_freq:0.00009613567978726062,news_rel_freq:0.000651641693206238,twitter_rel_freq:0.0001231395877182654,wikipedia_rel_freq:0.0007110466808604344},授:{jlpt_level:1,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0002909219696682225,aozora_rel_freq:0.0001337624350404277,news_rel_freq:0.0003734050333021468,twitter_rel_freq:0.0004284897829125031,wikipedia_rel_freq:0.00033496161538775057},催:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00008731660550489724,news_rel_freq:0.0006169469094216108,twitter_rel_freq:0.00021679364103970592,wikipedia_rel_freq:0.00045675656940200444},及:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.0004024916720937644,news_rel_freq:0.00025245785407529,twitter_rel_freq:0.00004327876743669556,wikipedia_rel_freq:0.0005105430952554045},憲:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00005901398165158573,news_rel_freq:0.00039230303005634314,twitter_rel_freq:0.00015372458271971771,wikipedia_rel_freq:0.0001683112046604738},離:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.0005322136501942547,news_rel_freq:0.00042641633701776433,twitter_rel_freq:0.00035392636372595605,wikipedia_rel_freq:0.0004755032748275313},激:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0001644341567689953,aozora_rel_freq:0.00023935822314379176,news_rel_freq:0.0004261255986061613,twitter_rel_freq:0.00034183229707505496,wikipedia_rel_freq:0.00016868975861147878},摘:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00006130616395405022,news_rel_freq:0.00047119005240462954,twitter_rel_freq:0.00003938067983847124,wikipedia_rel_freq:0.0001116058621478096},系:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0001201634222542658,aozora_rel_freq:0.00012595347499304866,news_rel_freq:0.00025526832538745256,twitter_rel_freq:0.00047526683409119483,wikipedia_rel_freq:0.0011614812718214126},批:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00022239995916030448,news_rel_freq:0.00028065948000078304,twitter_rel_freq:0.000045177835753779196,wikipedia_rel_freq:0.0001259985598405652},郎:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.001873548227884724,news_rel_freq:0.00037427724853695584,twitter_rel_freq:0.0004070003256402409,wikipedia_rel_freq:0.0010889365692106372},健:{jlpt_level:1,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0004047610012775269,aozora_rel_freq:0.00020307181177935392,news_rel_freq:0.0004344600997387812,twitter_rel_freq:0.00026087201618885775,wikipedia_rel_freq:0.00032246551122730286},盟:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.00006280191003277704,news_rel_freq:0.00030983023396495286,twitter_rel_freq:0.000025787348726714673,wikipedia_rel_freq:0.00026600234127588764},従:{jlpt_level:1,joyo_grade:6,frequency:1000,aozora_rel_freq:0.00047183989938019,news_rel_freq:0.00024606160902002354,twitter_rel_freq:0.00004997548202851681,wikipedia_rel_freq:0.00035993343022980404},修:{jlpt_level:1,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00022135367257364753,aozora_rel_freq:0.0002737409576807591,news_rel_freq:0.00034491266896505073,twitter_rel_freq:0.0004408837024555753,wikipedia_rel_freq:0.0006278247174834338},隊:{jlpt_level:1,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0002403268445085316,aozora_rel_freq:0.00030965828884395264,news_rel_freq:0.0005256550481782621,twitter_rel_freq:0.0001703164427531853,wikipedia_rel_freq:0.000934185753387679},織:{jlpt_level:1,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00017075854741395666,aozora_rel_freq:0.0002899416359880081,news_rel_freq:0.0006364263829990132,twitter_rel_freq:0.00025277598810023803,wikipedia_rel_freq:0.0003526950198333146},拡:{jlpt_level:1,joyo_grade:6,frequency:1000,aozora_rel_freq:0.00009732062148599226,news_rel_freq:0.0003781537606916628,twitter_rel_freq:0.00024517971483190346,wikipedia_rel_freq:0.00015264391454009195},故:{jlpt_level:1,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0017202342554294894,aozora_rel_freq:0.0005974437194457441,news_rel_freq:0.0007780159894496845,twitter_rel_freq:0.00035752459843200926,wikipedia_rel_freq:0.00024582299396170887},振:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.00061319761645675,news_rel_freq:0.00047855542549857277,twitter_rel_freq:0.00035682494168361005,wikipedia_rel_freq:0.00026148263652752497},弁:{jlpt_level:1,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00009486585967442038,aozora_rel_freq:0.00032418839360872753,news_rel_freq:0.00033347695810866524,twitter_rel_freq:0.00038581072126014974,wikipedia_rel_freq:0.0001817530564022202},就:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00024372890973747404,news_rel_freq:0.00035576690299823015,twitter_rel_freq:0.00017051634468129935,wikipedia_rel_freq:0.00029857582535630406},異:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.00047679334418636326,news_rel_freq:0.0002812409568239891,twitter_rel_freq:0.00018650849893042472,wikipedia_rel_freq:0.0004551531321280506},献:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00007824500266378779,news_rel_freq:0.00019808977110552506,twitter_rel_freq:0.000052574207093999686,wikipedia_rel_freq:0.00037097140065304736},厳:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0002909219696682225,aozora_rel_freq:0.0001989925042919171,news_rel_freq:0.0002236747513265909,twitter_rel_freq:0.0001748142361357518,wikipedia_rel_freq:0.00010597216361770159},維:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00007746799171379982,news_rel_freq:0.00031671104303955766,twitter_rel_freq:0.00004827631563954724,wikipedia_rel_freq:0.00011879583803204928},浜:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0004110853919224883,aozora_rel_freq:0.00017801320864224213,news_rel_freq:0.0004999731551533287,twitter_rel_freq:0.001201510538929601,wikipedia_rel_freq:0.000581795361144567},遺:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0007715756586852857,aozora_rel_freq:0.00021525145842041522,news_rel_freq:0.0007102739395461806,twitter_rel_freq:0.00006496812663707185,wikipedia_rel_freq:0.0002841601849998512},塁:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.000008352867712370593,news_rel_freq:0.00053282659566447,twitter_rel_freq:0.00009125523018407169,wikipedia_rel_freq:0.0001362590288829565},邦:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.000060393176087814356,news_rel_freq:0.00021650320384038307,twitter_rel_freq:0.00002068984955980596,wikipedia_rel_freq:0.0002719444911734812},素:{jlpt_level:1,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00043005856385737234,aozora_rel_freq:0.0005276487108630754,news_rel_freq:0.00022202723366084045,twitter_rel_freq:0.0008720721613976184,wikipedia_rel_freq:0.0004148020850542588},遣:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.0002472643095599193,news_rel_freq:0.00021504951178236796,twitter_rel_freq:0.0000897559657232162,wikipedia_rel_freq:0.00009839726082031879},抗:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.0001311011725367189,news_rel_freq:0.00027843048551182657,twitter_rel_freq:0.0000888564070467029,wikipedia_rel_freq:0.00019200842707490102},模:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00017688654276475958,news_rel_freq:0.0008090280866873401,twitter_rel_freq:0.0002384830002400822,wikipedia_rel_freq:0.0002889131401624695},雄:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00017708293805891801,aozora_rel_freq:0.0003472073430021209,news_rel_freq:0.0002754261885919287,twitter_rel_freq:0.00009325424946521236,wikipedia_rel_freq:0.0004545935860523227},益:{jlpt_level:1,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00010751464096434309,aozora_rel_freq:0.00018858055756207842,news_rel_freq:0.00031729251986276373,twitter_rel_freq:0.00005047523684880198,wikipedia_rel_freq:0.0001575804110122884},緊:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.00007717661260755435,news_rel_freq:0.00024480174256974376,twitter_rel_freq:0.00018900727303185056,wikipedia_rel_freq:0.00008931961355076464},標:{jlpt_level:1,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00018340732870387937,aozora_rel_freq:0.00013622944480663946,news_rel_freq:0.00043145580281888333,twitter_rel_freq:0.0001697167369688431,wikipedia_rel_freq:0.00048159327744672954},宣:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00009486585967442038,aozora_rel_freq:0.00011808623912442055,news_rel_freq:0.0001456599442131136,twitter_rel_freq:0.0000847584175203645,wikipedia_rel_freq:0.00022221244383236025},昭:{jlpt_level:1,joyo_grade:3,frequency:1000,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.0005144395247132801,news_rel_freq:0.0001540913581496012,twitter_rel_freq:0.00008925621090293102,wikipedia_rel_freq:0.0010461319317136648},廃:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00009092970642234127,news_rel_freq:0.0002522640284675547,twitter_rel_freq:0.00008305925113139494,wikipedia_rel_freq:0.00056208761302861},伊:{jlpt_level:1,frequency:1000,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.000367662156260554,news_rel_freq:0.0004054831713823468,twitter_rel_freq:0.00035332665794161384,wikipedia_rel_freq:0.0005724653445743429},江:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00041740978256744963,aozora_rel_freq:0.0005458307670927938,news_rel_freq:0.00041876022551221807,twitter_rel_freq:0.00048166369579084504,wikipedia_rel_freq:0.0007200478525843311},僚:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00004778617342425967,news_rel_freq:0.00015418827095346887,twitter_rel_freq:0.00002568739776265764,wikipedia_rel_freq:0.00007848685250836916},吉:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0001644341567689953,aozora_rel_freq:0.001078005566739549,news_rel_freq:0.00040606464820555285,twitter_rel_freq:0.0004218930192847389,wikipedia_rel_freq:0.0007216359947491534},盛:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0001960561099938021,aozora_rel_freq:0.0002996736981366073,news_rel_freq:0.00027891504953116494,twitter_rel_freq:0.00045287781814241934,wikipedia_rel_freq:0.0001971985674401951},皇:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00021502928192868617,aozora_rel_freq:0.00025761798046850887,news_rel_freq:0.0002888970683295353,twitter_rel_freq:0.00006626748916981329,wikipedia_rel_freq:0.0004384394016245876},臨:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.0000904634998523485,news_rel_freq:0.0002617614832465867,twitter_rel_freq:0.00011174517781576359,wikipedia_rel_freq:0.00015934444693212313},踏:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.0002855515241205761,news_rel_freq:0.0002583695351112181,twitter_rel_freq:0.00012383924446666465,wikipedia_rel_freq:0.00007964035865537091},壊:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0013091488635070011,aozora_rel_freq:0.00009862211482722209,news_rel_freq:0.0001702757963955027,twitter_rel_freq:0.0002916569131184241,wikipedia_rel_freq:0.0002006412415872136},債:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00001950297484469785,news_rel_freq:0.0001703727091993704,twitter_rel_freq:0.000009595292549475227,wikipedia_rel_freq:0.000054343522744272746},興:{jlpt_level:1,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0003288683135379906,aozora_rel_freq:0.000426850965375887,news_rel_freq:0.00037282355647894077,twitter_rel_freq:0.00027426544537250026,wikipedia_rel_freq:0.00035801007025651607},源:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.0003551717052394975,news_rel_freq:0.0007014548743942223,twitter_rel_freq:0.00016401953201759217,wikipedia_rel_freq:0.0003673311646797468},儀:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00027968509144816697,news_rel_freq:0.00014023282719652385,twitter_rel_freq:0.00004927582528011757,wikipedia_rel_freq:0.00009968204998736605},創:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00017781895590474514,news_rel_freq:0.0002450924809813468,twitter_rel_freq:0.00009855165056023514,wikipedia_rel_freq:0.0004238618880298262},障:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0003162195322480679,aozora_rel_freq:0.00018207309085592924,news_rel_freq:0.000477295559048293,twitter_rel_freq:0.0001299362532741437,wikipedia_rel_freq:0.0001896427835292267},継:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00009514499082602597,news_rel_freq:0.0003331862196970622,twitter_rel_freq:0.00011064571721113622,wikipedia_rel_freq:0.000501708895139527},筋:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.0002400186824512815,news_rel_freq:0.0001607783416164707,twitter_rel_freq:0.00042918943966090237,wikipedia_rel_freq:0.00010678917736381001},闘:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.00015579069547258642,news_rel_freq:0.0002421850968653166,twitter_rel_freq:0.00012154037229335288,wikipedia_rel_freq:0.000410654561294763},葬:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00010786854513207885,news_rel_freq:0.00009972327517983624,twitter_rel_freq:0.000020090143775463756,wikipedia_rel_freq:0.00006615007240137469},避:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0009802805499690105,aozora_rel_freq:0.0001416879467303049,news_rel_freq:0.00047642334381348394,twitter_rel_freq:0.00012034096072466848,wikipedia_rel_freq:0.00022521410899942006},司:{jlpt_level:1,joyo_grade:4,frequency:1000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00016121034684875245,news_rel_freq:0.0003428775000838296,twitter_rel_freq:0.00029335607950739366,wikipedia_rel_freq:0.000556054967068655},康:{jlpt_level:1,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00033519270418295197,aozora_rel_freq:0.00014448518615026157,news_rel_freq:0.00023646724143712384,twitter_rel_freq:0.00013573340918945166,wikipedia_rel_freq:0.000258822562131069},善:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.0003295691944373941,news_rel_freq:0.00033076339960037035,twitter_rel_freq:0.00008915625993887399,wikipedia_rel_freq:0.0001959214258277136},逮:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00017708293805891801,aozora_rel_freq:0.000011111256584827859,news_rel_freq:0.0004825288504571474,twitter_rel_freq:0.0000335835239231633,wikipedia_rel_freq:0.000055772340855641774},迫:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.0002033826161593491,news_rel_freq:0.00020681192345361568,twitter_rel_freq:0.00006936596905558133,wikipedia_rel_freq:0.00007871627914534187},惑:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00017708293805891801,aozora_rel_freq:0.00020250847884061265,news_rel_freq:0.0001573863934811021,twitter_rel_freq:0.0002574736834109186,wikipedia_rel_freq:0.00022553020792147137},崩:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0002719487977333384,aozora_rel_freq:0.00011334647232949398,news_rel_freq:0.000155932701423087,twitter_rel_freq:0.00010774713925348224,wikipedia_rel_freq:0.00008780539774674466},紀:{jlpt_level:1,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00017708293805891801,aozora_rel_freq:0.00022239995916030448,news_rel_freq:0.0002407314048073015,twitter_rel_freq:0.00010474861033177123,wikipedia_rel_freq:0.0007234166003705472},聴:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00024949821604113465,news_rel_freq:0.00019101513642318487,twitter_rel_freq:0.0004837626660360427,wikipedia_rel_freq:0.0001314703851323647},脱:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00021826237585161856,news_rel_freq:0.0001989619863403341,twitter_rel_freq:0.00018900727303185056,wikipedia_rel_freq:0.00017726394187212057},級:{jlpt_level:1,joyo_grade:3,frequency:1000,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.00021307582776044893,news_rel_freq:0.0004525827940620362,twitter_rel_freq:0.00040310223804201656,wikipedia_rel_freq:0.0006116220985434489},博:{jlpt_level:1,joyo_grade:4,frequency:1000,nhk_rel_freq:0.000423734173212411,aozora_rel_freq:0.00043454337378076786,news_rel_freq:0.00030198029685167126,twitter_rel_freq:0.00024248103880236357,wikipedia_rel_freq:0.00048650938044008394},締:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00010864555608206681,news_rel_freq:0.00020429219055305618,twitter_rel_freq:0.00011494360866558866,wikipedia_rel_freq:0.00015720313165371104},救:{jlpt_level:1,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0001644341567689953,aozora_rel_freq:0.00017710022077600628,news_rel_freq:0.00026292443689299877,twitter_rel_freq:0.00010934635467839477,wikipedia_rel_freq:0.00016976296543554008},執:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00017919815034097376,news_rel_freq:0.00015283149169932142,twitter_rel_freq:0.000032184210426364825,wikipedia_rel_freq:0.00020002816262952537},房:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00013913659418914989,aozora_rel_freq:0.0004818827659087844,news_rel_freq:0.0001504086716026296,twitter_rel_freq:0.00010824689407376741,wikipedia_rel_freq:0.0002936342305143971},撤:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00001045079727733809,news_rel_freq:0.00017822264631265196,twitter_rel_freq:0.000034882886455904736,wikipedia_rel_freq:0.00008920617482470591},削:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00004228882095309484,news_rel_freq:0.0001518623636606447,twitter_rel_freq:0.00007886131064099953,wikipedia_rel_freq:0.0021532199716861274},密:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00010751464096434309,aozora_rel_freq:0.00032494597928496577,news_rel_freq:0.00019993111437901085,twitter_rel_freq:0.00009885150345240625,wikipedia_rel_freq:0.0002671303555743369},措:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00002754503817707326,news_rel_freq:0.00014178343205840664,twitter_rel_freq:0.000004297891454452446,wikipedia_rel_freq:0.000035715354414515123},志:{jlpt_level:1,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.0004939264356335979,news_rel_freq:0.00034811079149268395,twitter_rel_freq:0.00024198128398207839,wikipedia_rel_freq:0.00043603679489851214},載:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00016544505652618685,news_rel_freq:0.00024170053284597822,twitter_rel_freq:0.00025607436991412013,wikipedia_rel_freq:0.0007420485924775878},陣:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.000186929409293354,news_rel_freq:0.00024228200966918426,twitter_rel_freq:0.00012084071554495364,wikipedia_rel_freq:0.00012247176259332337},我:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.001044963176091311,news_rel_freq:0.00009700971667154139,twitter_rel_freq:0.0005328385893880462,wikipedia_rel_freq:0.00013335678192525155},為:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.0005099911370245989,news_rel_freq:0.0003630353632883057,twitter_rel_freq:0.0002458793715803027,wikipedia_rel_freq:0.0002867157428172418},抑:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00009594142704976363,news_rel_freq:0.00018694479866074258,twitter_rel_freq:0.00007086523351643684,wikipedia_rel_freq:0.00006025890620088617},幕:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00022082651198657884,news_rel_freq:0.0005747898397391728,twitter_rel_freq:0.00011444385384530349,wikipedia_rel_freq:0.00027963155810449515},染:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0004047610012775269,aozora_rel_freq:0.0001929900947032601,news_rel_freq:0.00042631942421389663,twitter_rel_freq:0.0002339852068575157,wikipedia_rel_freq:0.00013260987076266255},奈:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00032254392289302926,aozora_rel_freq:0.00013092634507297162,news_rel_freq:0.00043794896067801746,twitter_rel_freq:0.0013008617972022926,wikipedia_rel_freq:0.0005354983403958989},傷:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00009486585967442038,aozora_rel_freq:0.0002426410944074909,news_rel_freq:0.0005034620160925649,twitter_rel_freq:0.00016581864937061878,wikipedia_rel_freq:0.000163300781827475},択:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00003937502989063998,news_rel_freq:0.0001120312012710308,twitter_rel_freq:0.00008046052606591206,wikipedia_rel_freq:0.00011185950604090723},秀:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.00021307582776044893,news_rel_freq:0.00018985218277677279,twitter_rel_freq:0.00006846641037906803,wikipedia_rel_freq:0.00037228040707621953},徴:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00011973738739314497,news_rel_freq:0.00012462986577382838,twitter_rel_freq:0.00004137969911961192,wikipedia_rel_freq:0.0002187442778367892},弾:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0002529756257984543,aozora_rel_freq:0.0001867934323771061,news_rel_freq:0.00016533324339825135,twitter_rel_freq:0.0002235903065955842,wikipedia_rel_freq:0.00030335809614475773},償:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.0000308667599882718,news_rel_freq:0.00019770211989005436,twitter_rel_freq:0.000025487495834543574,wikipedia_rel_freq:0.00005510445442356562},功:{jlpt_level:1,joyo_grade:4,frequency:1000,nhk_rel_freq:0.0001644341567689953,aozora_rel_freq:0.00017183597158983784,news_rel_freq:0.00013558101261087552,twitter_rel_freq:0.00012413909735883575,wikipedia_rel_freq:0.00022423904579228597},拠:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00018321918200716147,news_rel_freq:0.0003138036589235275,twitter_rel_freq:0.00006166974482318975,wikipedia_rel_freq:0.0002192579385851226},秘:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.0002546264883110552,news_rel_freq:0.00011959039997270936,twitter_rel_freq:0.00009995096405703362,wikipedia_rel_freq:0.00017596385759594178},拒:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00004778617342425967,news_rel_freq:0.00007723950468253594,twitter_rel_freq:0.00004087994429932675,wikipedia_rel_freq:0.00005950562207615906},刑:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00016480402249244676,news_rel_freq:0.00033163561483517945,twitter_rel_freq:0.00005047523684880198,wikipedia_rel_freq:0.0002444846719127013},塚:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00008955051198611264,news_rel_freq:0.0001876231882878163,twitter_rel_freq:0.0002565741247344053,wikipedia_rel_freq:0.0003219735185502391},致:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.0003412826345084627,news_rel_freq:0.00036797791628555705,twitter_rel_freq:0.0002895579428732264,wikipedia_rel_freq:0.00011849885799641236},繰:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.0001707093057123553,news_rel_freq:0.00015622343983469,twitter_rel_freq:0.00007696224232391588,wikipedia_rel_freq:0.00010491552649519943},尾:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.0003523550405457911,news_rel_freq:0.0001986712479287311,twitter_rel_freq:0.000288358531304542,wikipedia_rel_freq:0.00045852442909912204},描:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000315699548980109,news_rel_freq:0.00013470879737606645,twitter_rel_freq:0.0001638196300894781,wikipedia_rel_freq:0.0002301263882154916},鈴:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00013069324178797522,news_rel_freq:0.00013984517598105315,twitter_rel_freq:0.00013043600809442888,wikipedia_rel_freq:0.00023916324852736172},盤:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00008725832968364815,news_rel_freq:0.00016969431957229665,twitter_rel_freq:0.0001019499833381743,wikipedia_rel_freq:0.0002668588673872525},項:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.000036985721219427,news_rel_freq:0.00008130984244497824,twitter_rel_freq:0.00002208916305660443,wikipedia_rel_freq:0.0009719340827242579},喪:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00003850089257190353,news_rel_freq:0.00005058848361892567,twitter_rel_freq:0.000007796175196448623,wikipedia_rel_freq:0.000023133852561416417},伴:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00019802124060443215,news_rel_freq:0.00017095418602257643,twitter_rel_freq:0.000020589898595748926,wikipedia_rel_freq:0.0002481911866922384},養:{jlpt_level:1,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.0003139318490688864,news_rel_freq:0.00018345593772150633,twitter_rel_freq:0.00011874174529975595,wikipedia_rel_freq:0.00025844145899520874},懸:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00011383903160930444,aozora_rel_freq:0.00021101674874298082,news_rel_freq:0.0002990729127356411,twitter_rel_freq:0.00005867121590147874,wikipedia_rel_freq:0.00004081244953259249},街:{jlpt_level:1,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00009486585967442038,aozora_rel_freq:0.00030540415389276854,news_rel_freq:0.00021611555262491237,twitter_rel_freq:0.00028026250321592225,wikipedia_rel_freq:0.00033624512996237023},契:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.000040404569399374034,news_rel_freq:0.0002599201399731009,twitter_rel_freq:0.00004447817900537996,wikipedia_rel_freq:0.0001655287693909657},掲:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00005427421485665916,news_rel_freq:0.0002515856388404809,twitter_rel_freq:0.00006116999000290458,wikipedia_rel_freq:0.00023338042268322142},躍:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.00011526957443071419,news_rel_freq:0.00019886507353646644,twitter_rel_freq:0.00007686229135985886,wikipedia_rel_freq:0.0001641063242417348},棄:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00012022301923688745,news_rel_freq:0.00019779903269392203,twitter_rel_freq:0.000030884847893623386,wikipedia_rel_freq:0.00007394802887359208},邸:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00011816394021941934,news_rel_freq:0.00014536920580151056,twitter_rel_freq:0.000019490437991121556,wikipedia_rel_freq:0.000041674074013667836},縮:{jlpt_level:1,joyo_grade:6,frequency:1000,aozora_rel_freq:0.0001128996910332509,news_rel_freq:0.00017560600060822476,twitter_rel_freq:0.00005487307926731146,wikipedia_rel_freq:0.00010764442888274723},還:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00007418512045010068,news_rel_freq:0.0001381976583153027,twitter_rel_freq:0.000057271902404680265,wikipedia_rel_freq:0.00009265904571114542},属:{jlpt_level:1,joyo_grade:5,frequency:1000,nhk_rel_freq:0.00013913659418914989,aozora_rel_freq:0.00013240266587794875,news_rel_freq:0.00028986619636821206,twitter_rel_freq:0.00009805189573994999,wikipedia_rel_freq:0.0010182744396154656},慮:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.0001868322829246055,news_rel_freq:0.00010611952023510271,twitter_rel_freq:0.00004927582528011757,wikipedia_rel_freq:0.000063144583457032},枠:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.000017560447469727946,news_rel_freq:0.0001414926936468036,twitter_rel_freq:0.00006886621423529616,wikipedia_rel_freq:0.0002442068107634788},恵:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00012764347380927248,news_rel_freq:0.0001798701639784024,twitter_rel_freq:0.00021169614187279722,wikipedia_rel_freq:0.00024401944567661773},露:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0002955166895541717,news_rel_freq:0.00018665406024913957,twitter_rel_freq:0.00008096028088619723,wikipedia_rel_freq:0.00013737684644198473},沖:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0005691951580465223,aozora_rel_freq:0.00007004753714141479,news_rel_freq:0.000632937522059777,twitter_rel_freq:0.00019700335015641326,wikipedia_rel_freq:0.00023254683923555386},緩:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00004763077123426208,news_rel_freq:0.00020390453933758547,twitter_rel_freq:0.000030285142109281186,wikipedia_rel_freq:0.00004020574353704239},節:{jlpt_level:1,joyo_grade:4,frequency:1000,nhk_rel_freq:0.00043005856385737234,aozora_rel_freq:0.00033145344599111497,news_rel_freq:0.00019818668390939273,twitter_rel_freq:0.00021379511211799492,wikipedia_rel_freq:0.0003209627667551315},需:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.000043104682450582204,news_rel_freq:0.00009381159414390814,twitter_rel_freq:0.000023688378481516968,wikipedia_rel_freq:0.000030912690147219414},射:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00039843661063256557,aozora_rel_freq:0.00019792411423568367,news_rel_freq:0.00024819369070511237,twitter_rel_freq:0.00010574811997234157,wikipedia_rel_freq:0.0002895568093384207},購:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.000021892283515910835,news_rel_freq:0.0001316075876523009,twitter_rel_freq:0.00015732281742577092,wikipedia_rel_freq:0.00007674321006737645},揮:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.00008958936253361204,news_rel_freq:0.00009109803563561329,twitter_rel_freq:0.00003058499500145229,wikipedia_rel_freq:0.000202300760927983},充:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00019450526605573661,news_rel_freq:0.0001488580667407468,twitter_rel_freq:0.0004509787498253357,wikipedia_rel_freq:0.00009561355095838306},貢:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00004968985025173018,news_rel_freq:0.00012744033708599092,twitter_rel_freq:0.00003528269031213287,wikipedia_rel_freq:0.00007186534484685079},鹿:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.0003478414854728747,aozora_rel_freq:0.00034423527611841695,news_rel_freq:0.0003726297308712054,twitter_rel_freq:0.0004301889493014727,wikipedia_rel_freq:0.00034684081681322725},却:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00018209251612967894,news_rel_freq:0.0001430432985086864,twitter_rel_freq:0.000034782935491847697,wikipedia_rel_freq:0.00008247250302955644},端:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.0004129424693711025,news_rel_freq:0.00016407337694797157,twitter_rel_freq:0.00030974803761274716,wikipedia_rel_freq:0.0002914737963495706},賃:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00007461247647259407,news_rel_freq:0.00014032974000039152,twitter_rel_freq:0.000039880434658756413,wikipedia_rel_freq:0.00005171021478879692},獲:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00006608478129647618,news_rel_freq:0.00026340900091233714,twitter_rel_freq:0.00003788141537761574,wikipedia_rel_freq:0.00023376407500393692},郡:{jlpt_level:1,joyo_grade:4,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00011571635572695726,news_rel_freq:0.00005553103661617704,twitter_rel_freq:0.00036502092073628677,wikipedia_rel_freq:0.001180479071955182},併:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00018168458538093526,news_rel_freq:0.00006522231700294441,twitter_rel_freq:0.000018390977386494186,wikipedia_rel_freq:0.0003307478128220182},徹:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00011031612962454092,news_rel_freq:0.0001596153879700586,twitter_rel_freq:0.00006676724399009846,wikipedia_rel_freq:0.0000890213589227001},貴:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.0006216281852641194,news_rel_freq:0.00013354584372965436,twitter_rel_freq:0.00025077696881909735,wikipedia_rel_freq:0.00024914075805082},衝:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00011272486356950361,news_rel_freq:0.00017861029752812264,twitter_rel_freq:0.00008995586765133026,wikipedia_rel_freq:0.00007993224032129732},焦:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00009963222906220644,news_rel_freq:0.00008857830273505377,twitter_rel_freq:0.00017651340252472137,wikipedia_rel_freq:0.000020272392561395488},奪:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00013275232080544333,news_rel_freq:0.00022309327450338487,twitter_rel_freq:0.00006376871506838745,wikipedia_rel_freq:0.0001317074593239032},災:{jlpt_level:1,joyo_grade:5,frequency:1000,nhk_rel_freq:0.0013723927699566146,aozora_rel_freq:0.00009195924593107533,news_rel_freq:0.0008724090604167987,twitter_rel_freq:0.00010145022851788913,wikipedia_rel_freq:0.00018388544953363894},浦:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.00009486585967442038,aozora_rel_freq:0.00012657508375303904,news_rel_freq:0.00028841250431019694,twitter_rel_freq:0.0002948553439682492,wikipedia_rel_freq:0.00033976300506261865},析:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00004908766676548951,news_rel_freq:0.00014478772897830451,twitter_rel_freq:0.00002678685836728501,wikipedia_rel_freq:0.00008363365673112395},譲:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00006824098668269278,news_rel_freq:0.000056306339047118423,twitter_rel_freq:0.000130835811950657,wikipedia_rel_freq:0.00011098003726584513},称:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00020087675584563793,news_rel_freq:0.00012191630726553352,twitter_rel_freq:0.0000600705293982772,wikipedia_rel_freq:0.0010872222423954799},納:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.0001201634222542658,aozora_rel_freq:0.0001989536537444177,news_rel_freq:0.00019886507353646644,twitter_rel_freq:0.0001772130592731206,wikipedia_rel_freq:0.00013305470351990413},樹:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.0002719149819482874,news_rel_freq:0.00023355985732109364,twitter_rel_freq:0.00012523855796346312,wikipedia_rel_freq:0.0003313430474857197},挑:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.000026301820657092518,news_rel_freq:0.00019857433512486343,twitter_rel_freq:0.00008555802523282078,wikipedia_rel_freq:0.00009991147662433878},誘:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00014660254098897876,news_rel_freq:0.00012104409203072446,twitter_rel_freq:0.0003000527940992149,wikipedia_rel_freq:0.00011315194276252025},紛:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00007752626753504893,news_rel_freq:0.00007355681813556434,twitter_rel_freq:0.00003258401428259296,wikipedia_rel_freq:0.00004218773476200121},至:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00048075610003130186,news_rel_freq:0.00007636728944772688,twitter_rel_freq:0.00007516312497088928,wikipedia_rel_freq:0.00016240601794328139},宗:{jlpt_level:1,joyo_grade:6,frequency:1000,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00035284067238953364,news_rel_freq:0.00008935360516599515,twitter_rel_freq:0.00006516802856518593,wikipedia_rel_freq:0.0003978347106576982},促:{jlpt_level:1,joyo_grade:9,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00007082454809140275,news_rel_freq:0.00014362477533189243,twitter_rel_freq:0.000012693772435243269,wikipedia_rel_freq:0.00004537549042349446},慎:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00004986467771547747,news_rel_freq:0.00014847041552527613,twitter_rel_freq:0.00004367857129292369,wikipedia_rel_freq:0.00006205863070869444},控:{jlpt_level:1,joyo_grade:9,frequency:1000,aozora_rel_freq:0.00007655500384756397,news_rel_freq:0.000188010839503287,twitter_rel_freq:0.00005057518781285901,wikipedia_rel_freq:0.00004020446894461477},智:{jlpt_level:1,frequency:1500,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00020505318970182322,news_rel_freq:0.00012191630726553352,twitter_rel_freq:0.00010844679600188147,wikipedia_rel_freq:0.00019787282683440938},握:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00019363112873700016,news_rel_freq:0.00014217108327387734,twitter_rel_freq:0.00012164032325740992,wikipedia_rel_freq:0.000050838393568300566},宙:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.0012079586131876195,aozora_rel_freq:0.00009827245989972751,news_rel_freq:0.0001459506826247166,twitter_rel_freq:0.00006506807760112889,wikipedia_rel_freq:0.00024386521999287495},俊:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.00011785313583942417,news_rel_freq:0.00009129186124334863,twitter_rel_freq:0.00002978538728899602,wikipedia_rel_freq:0.00017915288784986266},銭:{jlpt_level:1,joyo_grade:5,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.0002589194738097387,news_rel_freq:0.0009328826500302271,twitter_rel_freq:0.00005717195144062323,wikipedia_rel_freq:0.000048577266601691596},渋:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00022135367257364753,aozora_rel_freq:0.00006812443504019458,news_rel_freq:0.0001013707928455867,twitter_rel_freq:0.0006467826884130646,wikipedia_rel_freq:0.00010134666769784594},銃:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0003604902667627974,aozora_rel_freq:0.00008696695057740266,news_rel_freq:0.00012172248165779817,twitter_rel_freq:0.000024487986193973237,wikipedia_rel_freq:0.00016336451144885632},操:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.0001960561099938021,aozora_rel_freq:0.00014485426635150585,news_rel_freq:0.00019295339250053836,twitter_rel_freq:0.00010754723732536817,wikipedia_rel_freq:0.00020229311337341722},携:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0004047610012775269,aozora_rel_freq:0.00004739766794926569,news_rel_freq:0.000343943540926374,twitter_rel_freq:0.00030574999905046585,wikipedia_rel_freq:0.0001821749464957645},診:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.00005709087955036552,news_rel_freq:0.0001677560634949432,twitter_rel_freq:0.00016152075791616634,wikipedia_rel_freq:0.00007353506092704118},託:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00003820951346565804,news_rel_freq:0.0000692926547653867,twitter_rel_freq:0.000017391467745923848,wikipedia_rel_freq:0.00009296877167105859},撮:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000847468346424822,aozora_rel_freq:0.00004640697898803104,news_rel_freq:0.0006664693521979921,twitter_rel_freq:0.0008419869212164512,wikipedia_rel_freq:0.0004039094181677649},誕:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00011383903160930444,aozora_rel_freq:0.00003218767860325133,news_rel_freq:0.00009352085573230512,twitter_rel_freq:0.0010561818371906742,wikipedia_rel_freq:0.00017507419208145867},侵:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000044872382361804816,news_rel_freq:0.00014604759542858427,twitter_rel_freq:0.000029485534396824918,wikipedia_rel_freq:0.00015182817538641113},括:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00006639558567647137,news_rel_freq:0.00007762715589800664,twitter_rel_freq:0.000058171461081193567,wikipedia_rel_freq:0.00006597672783121752},謝:{jlpt_level:1,joyo_grade:5,frequency:1500,nhk_rel_freq:0.0001517853754790726,aozora_rel_freq:0.0001270995661442809,news_rel_freq:0.00023501354937910873,twitter_rel_freq:0.000404301649610701,wikipedia_rel_freq:0.00007890364423220294},駆:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00014114403906531332,news_rel_freq:0.0001256959066163728,twitter_rel_freq:0.0000930543475370983,wikipedia_rel_freq:0.00020069732365402915},透:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0001377057656116166,news_rel_freq:0.00009041964600853957,twitter_rel_freq:0.00004787651178331911,wikipedia_rel_freq:0.000057416565087279636},津:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0009043878622294742,aozora_rel_freq:0.00028003474637566155,news_rel_freq:0.0006781958014659806,twitter_rel_freq:0.0005391355001236394,wikipedia_rel_freq:0.0006660268017242478},壁:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0003162195322480679,aozora_rel_freq:0.00029850818171162536,news_rel_freq:0.00009293937890909908,twitter_rel_freq:0.0001141440009531324,wikipedia_rel_freq:0.00009814871529693167},稲:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0001644341567689953,aozora_rel_freq:0.00010248774430341221,news_rel_freq:0.00010747629948925014,twitter_rel_freq:0.00014612830945138315,wikipedia_rel_freq:0.00019203901729316405},仮:{jlpt_level:1,joyo_grade:5,frequency:1500,nhk_rel_freq:0.000265624407088377,aozora_rel_freq:0.00028017072329190943,news_rel_freq:0.0001242422145583577,twitter_rel_freq:0.00013443404665671021,wikipedia_rel_freq:0.0005721543440220021},裂:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00011153992187077197,news_rel_freq:0.00005146069885373474,twitter_rel_freq:0.00004997548202851681,wikipedia_rel_freq:0.00006527187821874021},敏:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00010658647706459871,news_rel_freq:0.00007200621327368157,twitter_rel_freq:0.000025287593906429505,wikipedia_rel_freq:0.00010694595223240804},是:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00032784034507367095,news_rel_freq:0.00007462285897810875,twitter_rel_freq:0.00029235656986682334,wikipedia_rel_freq:0.00003169019152807143},排:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00005198203255419467,news_rel_freq:0.00009119494843948096,twitter_rel_freq:0.00002488779005020137,wikipedia_rel_freq:0.0000995584145218863},裕:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.0001436693246527742,news_rel_freq:0.00015486666058054258,twitter_rel_freq:0.0002583732420874319,wikipedia_rel_freq:0.00018221063508373805},堅:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00012191301805311126,news_rel_freq:0.00009293937890909908,twitter_rel_freq:0.000023788329445574,wikipedia_rel_freq:0.000043468700151765596},訳:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00015810976612403395,aozora_rel_freq:0.0004021614424400195,news_rel_freq:0.00009526528620192325,twitter_rel_freq:0.00032683965246649993,wikipedia_rel_freq:0.0003467566937130039},芝:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.00022960673572144282,news_rel_freq:0.00008208514487591964,twitter_rel_freq:0.00007516312497088928,wikipedia_rel_freq:0.00014095717657118686},綱:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00013828852382410757,news_rel_freq:0.0001662054586330604,twitter_rel_freq:0.000024288084265859168,wikipedia_rel_freq:0.00013253594440186024},典:{jlpt_level:1,joyo_grade:4,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.0001336847339454289,news_rel_freq:0.00017202022686512084,twitter_rel_freq:0.00009805189573994999,wikipedia_rel_freq:0.0008667840312223753},賀:{jlpt_level:1,joyo_grade:5,frequency:1500,nhk_rel_freq:0.00036681465740775874,aozora_rel_freq:0.00016925241018112786,news_rel_freq:0.00035712368225237763,twitter_rel_freq:0.0004212933135003967,wikipedia_rel_freq:0.00044398770246204466},扱:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00014077495886406904,news_rel_freq:0.00008412031375714078,twitter_rel_freq:0.00008555802523282078,wikipedia_rel_freq:0.00022146680726219887},顧:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00010202153773341943,news_rel_freq:0.00010747629948925014,twitter_rel_freq:0.00001969033991923562,wikipedia_rel_freq:0.00005825142312737483},看:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00010751464096434309,aozora_rel_freq:0.00016962149038237214,news_rel_freq:0.00008092219122950754,twitter_rel_freq:0.0000936540533214405,wikipedia_rel_freq:0.00007895462792930799},訟:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000014452403669776096,news_rel_freq:0.00015205618926838004,twitter_rel_freq:0.000008895635801075991,wikipedia_rel_freq:0.00003553181310493694},戒:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.00008821016809738341,news_rel_freq:0.0003889110819209746,twitter_rel_freq:0.00002458793715803027,wikipedia_rel_freq:0.00007324190466868714},祉:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.0000017482746374729149,news_rel_freq:0.00006473775298360604,twitter_rel_freq:0.000025387544870486538,wikipedia_rel_freq:0.00007399646338584188},誉:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00008339270020745803,news_rel_freq:0.0001083485147240592,twitter_rel_freq:0.00002398823137368807,wikipedia_rel_freq:0.00010459178001858236},歓:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00009135706244483465,news_rel_freq:0.00009807575751408579,twitter_rel_freq:0.0000906555243997295,wikipedia_rel_freq:0.00002444158439216095},奏:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00008993901746110662,news_rel_freq:0.0000821820576797873,twitter_rel_freq:0.00011144532492359248,wikipedia_rel_freq:0.00028304109284839536},勧:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00031517506658886713,news_rel_freq:0.00009962636237596857,twitter_rel_freq:0.00005127484456125825,wikipedia_rel_freq:0.0000504126796974734},騒:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00024984787096862923,news_rel_freq:0.00005330204212722054,twitter_rel_freq:0.00012293968579015136,wikipedia_rel_freq:0.00005949669992916567},閥:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000016122977212250216,news_rel_freq:0.000007656111505546224,twitter_rel_freq:0.0000045977443466235465,wikipedia_rel_freq:0.000025695783340945177},甲:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.0002817053199181357,news_rel_freq:0.000192759566892803,twitter_rel_freq:0.0003234413196885608,wikipedia_rel_freq:0.0003104142398240967},縄:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0005565463767565995,aozora_rel_freq:0.00007952707073126793,news_rel_freq:0.00044870628190732924,twitter_rel_freq:0.00015812242513822718,wikipedia_rel_freq:0.00017762720071399403},郷:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.0002920978413742247,news_rel_freq:0.0001187181847379003,twitter_rel_freq:0.0001183419414435278,wikipedia_rel_freq:0.0002872931331869565},揺:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00018340732870387937,aozora_rel_freq:0.00014825368925770318,news_rel_freq:0.00010631334584283806,twitter_rel_freq:0.00013373438990831098,wikipedia_rel_freq:0.00002638916162157386},免:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.00014479599053025675,news_rel_freq:0.00013470879737606645,twitter_rel_freq:0.0001908063903848772,wikipedia_rel_freq:0.00012189437222360869},既:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.0002200300757628412,news_rel_freq:0.00014643524664405497,twitter_rel_freq:0.00010984610949867994,wikipedia_rel_freq:0.00011681512139951808},薦:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.000016297804675997506,news_rel_freq:0.00009071038442014259,twitter_rel_freq:0.00002458793715803027,wikipedia_rel_freq:0.00005474374476654739},隣:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00020238050063876346,aozora_rel_freq:0.00023467673217011426,news_rel_freq:0.00011445402136772265,twitter_rel_freq:0.0002751650040490136,wikipedia_rel_freq:0.0001748613351460451},華:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.00017902332287722647,news_rel_freq:0.00013732544308049365,twitter_rel_freq:0.0002856598552750021,wikipedia_rel_freq:0.0003217721329466742},範:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00012803197928426647,news_rel_freq:0.0001128065037019722,twitter_rel_freq:0.00005997057843422017,wikipedia_rel_freq:0.00019446711586779204},隠:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.0003677981331768019,news_rel_freq:0.00009507146059418791,twitter_rel_freq:0.00015412438657594585,wikipedia_rel_freq:0.00012596669502987456},徳:{jlpt_level:1,joyo_grade:5,frequency:1500,nhk_rel_freq:0.00011383903160930444,aozora_rel_freq:0.0004509188795517641,news_rel_freq:0.00019973728877127552,twitter_rel_freq:0.0001772130592731206,wikipedia_rel_freq:0.00046691634564261327},哲:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.0002487989061861455,news_rel_freq:0.000059019897555413285,twitter_rel_freq:0.00003228416139042186,wikipedia_rel_freq:0.00019251444026866863},杉:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00010751464096434309,aozora_rel_freq:0.00017589585380352495,news_rel_freq:0.00009419924535937885,twitter_rel_freq:0.00016421943394570623,wikipedia_rel_freq:0.00018530407090558694},釈:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00016084126664750816,news_rel_freq:0.00011658610305281147,twitter_rel_freq:0.000034682984527790664,wikipedia_rel_freq:0.00017105667674958074},己:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00045243405090424066,news_rel_freq:0.0000748166845858441,twitter_rel_freq:0.00010444875743960014,wikipedia_rel_freq:0.0001097360350564819},妥:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000024708948209617196,news_rel_freq:0.000051073047638264045,twitter_rel_freq:0.000022988721733117732,wikipedia_rel_freq:0.000028850399599320145},威:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00019728308020194359,news_rel_freq:0.00008043762721016918,twitter_rel_freq:0.000038681023090072014,wikipedia_rel_freq:0.00008295429896719916},豪:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00011674589523569132,news_rel_freq:0.0002509072492134072,twitter_rel_freq:0.00010294949297874462,wikipedia_rel_freq:0.00011130760751974506},熊:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0011194171441581604,aozora_rel_freq:0.00015079840011891375,news_rel_freq:0.00020400145214145314,twitter_rel_freq:0.00026417039800273986,wikipedia_rel_freq:0.0002829034368662117},滞:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000047164564664269306,news_rel_freq:0.00010708864827377944,twitter_rel_freq:0.00007476332111466115,wikipedia_rel_freq:0.00004851226238788266},微:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00009486585967442038,aozora_rel_freq:0.0003572307842569656,news_rel_freq:0.00004729344828742477,twitter_rel_freq:0.00027966279743158004,wikipedia_rel_freq:0.00007686047257071806},隆:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.00013918208641659373,news_rel_freq:0.0001128065037019722,twitter_rel_freq:0.00003638215091676024,wikipedia_rel_freq:0.00021657747070982458},症:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0007273049241705562,aozora_rel_freq:0.00002634067120459192,news_rel_freq:0.00031486969976607187,twitter_rel_freq:0.00016631840419090393,wikipedia_rel_freq:0.000157540898647032},暫:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00019281526723951282,news_rel_freq:0.00005814768232060422,twitter_rel_freq:0.000021489457272262228,wikipedia_rel_freq:0.000036460990984676473},忠:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.0002176019165441288,news_rel_freq:0.00005155761165760241,twitter_rel_freq:0.00002708671125945611,wikipedia_rel_freq:0.0002323250601531469},倉:{jlpt_level:1,joyo_grade:4,frequency:1500,nhk_rel_freq:0.00024665123515349294,aozora_rel_freq:0.0002823075034043764,news_rel_freq:0.00018335902491763866,twitter_rel_freq:0.00032274166294016157,wikipedia_rel_freq:0.000409634887352662},肝:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0001201634222542658,aozora_rel_freq:0.00005889743000908753,news_rel_freq:0.00007772406870187431,twitter_rel_freq:0.00003928072887441421,wikipedia_rel_freq:0.000027603848205101672},喚:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00005893628055658693,news_rel_freq:0.000017153566284578247,twitter_rel_freq:0.000018291026422437153,wikipedia_rel_freq:0.000025421745969005533},沿:{jlpt_level:1,joyo_grade:6,frequency:1500,aozora_rel_freq:0.00007659385439506337,news_rel_freq:0.00013499953578766948,twitter_rel_freq:0.000036082298024589136,wikipedia_rel_freq:0.0002483849247412376},妙:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.0004483741686905536,news_rel_freq:0.000049813181187984286,twitter_rel_freq:0.00014652811330761128,wikipedia_rel_freq:0.00008396377616987915},唱:{jlpt_level:1,joyo_grade:4,frequency:1500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00012158278839936638,news_rel_freq:0.00005650016465485377,twitter_rel_freq:0.00006516802856518593,wikipedia_rel_freq:0.00012529116104323265},阿:{jlpt_level:1,frequency:1500,nhk_rel_freq:0.00013913659418914989,aozora_rel_freq:0.0002423885658487448,news_rel_freq:0.00013645322784568457,twitter_rel_freq:0.00013873193811116266,wikipedia_rel_freq:0.0002225795264515166},索:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.0000739520171651043,news_rel_freq:0.000224837704973003,twitter_rel_freq:0.00010514841418799937,wikipedia_rel_freq:0.0001505930953240413},誠:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00013892955785784763,news_rel_freq:0.00010001401359143926,twitter_rel_freq:0.00005757175529685136,wikipedia_rel_freq:0.0001294361356178732},襲:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.00015132288251015562,news_rel_freq:0.0001828744608983003,twitter_rel_freq:0.00006686719495415549,wikipedia_rel_freq:0.00016939715740881136},懇:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00004689261083177352,news_rel_freq:0.00005058848361892567,twitter_rel_freq:0.000019490437991121556,wikipedia_rel_freq:0.000013505581363127734},俳:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.00016538678070493774,news_rel_freq:0.0000895474307737305,twitter_rel_freq:0.000024987741014258404,wikipedia_rel_freq:0.00026669826874137155},柄:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00025342212133857385,news_rel_freq:0.00010708864827377944,twitter_rel_freq:0.00010594802190045563,wikipedia_rel_freq:0.00009823028921229975},驚:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0001517853754790726,aozora_rel_freq:0.000500045396864753,news_rel_freq:0.00005058848361892567,twitter_rel_freq:0.00011144532492359248,wikipedia_rel_freq:0.000035122668935668915},麻:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00013300484936418943,news_rel_freq:0.0001345149717683311,twitter_rel_freq:0.0001793120295183183,wikipedia_rel_freq:0.00022951585844265863},剤:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00011383903160930444,aozora_rel_freq:0.00002235849008590361,news_rel_freq:0.00011968731277657703,twitter_rel_freq:0.00007836155582071436,wikipedia_rel_freq:0.00008649511673114488},瀬:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.00016472632139744798,news_rel_freq:0.00021291743009727913,twitter_rel_freq:0.00025797343823120376,wikipedia_rel_freq:0.00033510564433207233},趣:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00019526285173197488,news_rel_freq:0.00004118794164376133,twitter_rel_freq:0.00008375890787979418,wikipedia_rel_freq:0.00007290796145264906},陥:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00009160959100358073,news_rel_freq:0.00006648218345322416,twitter_rel_freq:0.000017791271602151983,wikipedia_rel_freq:0.0000581188655149017},斎:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00019545710446947187,news_rel_freq:0.00006667600906095951,twitter_rel_freq:0.00006966582194775243,wikipedia_rel_freq:0.00009192742965768794},貫:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00012630312992054324,news_rel_freq:0.00005620942624325075,twitter_rel_freq:0.000046477198286520635,wikipedia_rel_freq:0.00012204987249977909},仙:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00022767806321860888,aozora_rel_freq:0.0001845012500746416,news_rel_freq:0.00024615852182389124,twitter_rel_freq:0.0003394334739376862,wikipedia_rel_freq:0.00022823744223774952},慰:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.00010545981118711616,news_rel_freq:0.00013945752476558247,twitter_rel_freq:0.000026986760295399076,wikipedia_rel_freq:0.000028084369550316767},序:{jlpt_level:1,joyo_grade:5,frequency:1500,aozora_rel_freq:0.00014295058952403533,news_rel_freq:0.00005485264698910332,twitter_rel_freq:0.000020389996667634857,wikipedia_rel_freq:0.00007861941012084229},旬:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00017708293805891801,aozora_rel_freq:0.00003121641491576638,news_rel_freq:0.00026738242587091176,twitter_rel_freq:0.00004677705117869173,wikipedia_rel_freq:0.00006890956500718552},兼:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00015342081207512313,news_rel_freq:0.0001068948226660441,twitter_rel_freq:0.000045677590574064366,wikipedia_rel_freq:0.00017456690429526342},聖:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.0001644341567689953,aozora_rel_freq:0.00018945469488081487,news_rel_freq:0.00012550208100863745,twitter_rel_freq:0.00023528456939025713,wikipedia_rel_freq:0.0003784609057577792},旨:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00008855982302487799,news_rel_freq:0.00004273854650564411,twitter_rel_freq:0.00009905140538052031,wikipedia_rel_freq:0.00005709281861066257},即:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00031515564131511745,news_rel_freq:0.00005669399026258912,twitter_rel_freq:0.0001037491006912009,wikipedia_rel_freq:0.00015917365154682122},柳:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00021461042438667514,news_rel_freq:0.00009216407647815769,twitter_rel_freq:0.00009585297453069524,wikipedia_rel_freq:0.0001604100062016187},舎:{jlpt_level:1,joyo_grade:5,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0002458074140286918,news_rel_freq:0.00010883307874339758,twitter_rel_freq:0.0001510259066901778,wikipedia_rel_freq:0.00023378319389035133},偽:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00009209522284732321,news_rel_freq:0.00009419924535937885,twitter_rel_freq:0.000036082298024589136,wikipedia_rel_freq:0.00006377040833899648},較:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00012634198046804264,news_rel_freq:0.00006318714812172325,twitter_rel_freq:0.000031384602713908557,wikipedia_rel_freq:0.0001101439046333223},覇:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000014938035513518572,news_rel_freq:0.0004758418669902779,twitter_rel_freq:0.00007916116353317063,wikipedia_rel_freq:0.00008959237633027667},詳:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00029724636031318384,aozora_rel_freq:0.00008339270020745803,news_rel_freq:0.00016116599283194137,twitter_rel_freq:0.00019170594906139048,wikipedia_rel_freq:0.00022626819693706695},抵:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00014240668185904376,news_rel_freq:0.00002907384116030211,twitter_rel_freq:0.000032683965246649996,wikipedia_rel_freq:0.000055717533381253846},脅:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00005198203255419467,news_rel_freq:0.00008227897048365497,twitter_rel_freq:0.000028286122828140515,wikipedia_rel_freq:0.00003195785593787294},茂:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.0001333350790179343,news_rel_freq:0.00009226098928202537,twitter_rel_freq:0.00005247425612994265,wikipedia_rel_freq:0.00016817864704800066},犠:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000056352719147876955,news_rel_freq:0.00015360679413026283,twitter_rel_freq:0.000024487986193973237,wikipedia_rel_freq:0.00002817231642782298},旗:{jlpt_level:1,joyo_grade:4,frequency:1500,nhk_rel_freq:0.00017075854741395666,aozora_rel_freq:0.00015120633086765744,news_rel_freq:0.00005184835006920543,twitter_rel_freq:0.00003098479885768042,wikipedia_rel_freq:0.00018622177745347785},距:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00006861006688393706,news_rel_freq:0.00009807575751408579,twitter_rel_freq:0.00010834684503782445,wikipedia_rel_freq:0.00017680763778303037},雅:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.000059227659662832416,news_rel_freq:0.0000770456790748006,twitter_rel_freq:0.00006466827374490076,wikipedia_rel_freq:0.00015696478286974494},飾:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00044270734514729505,aozora_rel_freq:0.00016697965315241306,news_rel_freq:0.00009623441424059999,twitter_rel_freq:0.00007736204618014403,wikipedia_rel_freq:0.0001057108721700382},網:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00015810976612403395,aozora_rel_freq:0.00008949223616486355,news_rel_freq:0.00007365373093943202,twitter_rel_freq:0.00003198430849825076,wikipedia_rel_freq:0.00013045963333725707},竜:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00025930001644341565,aozora_rel_freq:0.00016402701154245882,news_rel_freq:0.00015031175879876192,twitter_rel_freq:0.00008195979052676757,wikipedia_rel_freq:0.00020988586046478678},詩:{jlpt_level:1,joyo_grade:3,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.000478813572656332,news_rel_freq:0.00004729344828742477,twitter_rel_freq:0.00003578244513241804,wikipedia_rel_freq:0.00015413008931070414},繁:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00014019220065157806,news_rel_freq:0.00010292139770746948,twitter_rel_freq:0.00003078489692956635,wikipedia_rel_freq:0.00010869469304311125},翼:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00008854146902945901,aozora_rel_freq:0.00007684638295380945,news_rel_freq:0.00013044463400588882,twitter_rel_freq:0.0000469769531068058,wikipedia_rel_freq:0.00013103065074483364},潟:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.000019619526487196043,news_rel_freq:0.00020913783074643985,twitter_rel_freq:0.0003312374948850094,wikipedia_rel_freq:0.0002452800175875401},敵:{jlpt_level:1,joyo_grade:5,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0003749660591904408,news_rel_freq:0.00008751226189250936,twitter_rel_freq:0.0004947572720823164,wikipedia_rel_freq:0.00020893756369863285},魅:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00007121305356639673,news_rel_freq:0.0000633809737294586,twitter_rel_freq:0.00008046052606591206,wikipedia_rel_freq:0.0000311981988510077},嫌:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00030919208227395985,news_rel_freq:0.00006657909625709184,twitter_rel_freq:0.0011082562894643888,wikipedia_rel_freq:0.00008075435243711625},斉:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00006284076058027644,news_rel_freq:0.00008189131926818428,twitter_rel_freq:0.000021289555344148162,wikipedia_rel_freq:0.00008685327720330785},敷:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.0005221707836656602,news_rel_freq:0.00015932464955845557,twitter_rel_freq:0.00012413909735883575,wikipedia_rel_freq:0.0001725313801883443},擁:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.0000349072169282092,news_rel_freq:0.00004835948912996918,twitter_rel_freq:0.000005197450130965748,wikipedia_rel_freq:0.00003334333790670267},圏:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.00006927052619142682,news_rel_freq:0.0001655270690059867,twitter_rel_freq:0.000042079355868011154,wikipedia_rel_freq:0.00019857002889232095},酸:{jlpt_level:1,joyo_grade:5,frequency:1500,nhk_rel_freq:0.0002403268445085316,aozora_rel_freq:0.00004221111985809604,news_rel_freq:0.0000829573601107287,twitter_rel_freq:0.00007646248750363071,wikipedia_rel_freq:0.0002128645829681493},罰:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00007148500739889252,news_rel_freq:0.00011697375426828217,twitter_rel_freq:0.00005617244180005289,wikipedia_rel_freq:0.00004640536110501647},滅:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0002173688132591324,news_rel_freq:0.00006696674747256253,twitter_rel_freq:0.0001061479238285697,wikipedia_rel_freq:0.00019809970428652686},礎:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.000055828236756635084,news_rel_freq:0.00005020083240345498,twitter_rel_freq:0.00003808131730572981,wikipedia_rel_freq:0.00017572678340440332},腐:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00010110854986718357,news_rel_freq:0.00002820162592549305,twitter_rel_freq:0.00011814203951541374,wikipedia_rel_freq:0.000028846575822037267},脚:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.00019481607043573182,news_rel_freq:0.00005398043175429426,twitter_rel_freq:0.0000796609183534558,wikipedia_rel_freq:0.0009070037952761216},潮:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00014489311689900526,news_rel_freq:0.00005727546708579516,twitter_rel_freq:0.00018420962675711296,wikipedia_rel_freq:0.00012019916429486578},梅:{jlpt_level:1,joyo_grade:4,frequency:1500,nhk_rel_freq:0.00009486585967442038,aozora_rel_freq:0.00020617985557930575,news_rel_freq:0.00010108005443398368,twitter_rel_freq:0.0006038037738685401,wikipedia_rel_freq:0.00012402039239288928},尽:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00018178171174968374,news_rel_freq:0.00007539816140905015,twitter_rel_freq:0.00008805679933424662,wikipedia_rel_freq:0.00004671508706492965},僕:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.0016174454187686917,news_rel_freq:0.00006095815363276676,twitter_rel_freq:0.000775719432046638,wikipedia_rel_freq:0.00006900006106954699},桜:{jlpt_level:1,joyo_grade:5,frequency:1500,nhk_rel_freq:0.0005375732048217154,aozora_rel_freq:0.00011249176028450722,news_rel_freq:0.00013955443756945014,twitter_rel_freq:0.0001647191887659914,wikipedia_rel_freq:0.0002048461220059526},滑:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0002719487977333384,aozora_rel_freq:0.0001108017614682834,news_rel_freq:0.00011183737566329545,twitter_rel_freq:0.00008096028088619723,wikipedia_rel_freq:0.0000699330627265694},孤:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.00010703325836084178,news_rel_freq:0.000031302835649258605,twitter_rel_freq:0.0000341832297075055,wikipedia_rel_freq:0.000044290812267584524},炎:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00008854146902945901,aozora_rel_freq:0.00007078569754390336,news_rel_freq:0.00008906286675439213,twitter_rel_freq:0.00030325122494904,wikipedia_rel_freq:0.00010997183465559275},賠:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00000452608878367988,news_rel_freq:0.00013180141326003624,twitter_rel_freq:0.00000939539062136116,wikipedia_rel_freq:0.00002208613758590764},句:{jlpt_level:1,joyo_grade:5,frequency:1500,aozora_rel_freq:0.000386252143239016,news_rel_freq:0.0000243251137707861,twitter_rel_freq:0.00009735223899155075,wikipedia_rel_freq:0.00006696326237020023},鋼:{jlpt_level:1,joyo_grade:6,frequency:1500,aozora_rel_freq:0.000015229414619764058,news_rel_freq:0.00003421021976528882,twitter_rel_freq:0.000009595292549475227,wikipedia_rel_freq:0.00007943514927452308},頑:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0004490317357922564,aozora_rel_freq:0.00006200547380903938,news_rel_freq:0.00008673695946156797,twitter_rel_freq:0.002857698013354648,wikipedia_rel_freq:0.00002128441894893073},鎖:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000060218348624067066,news_rel_freq:0.00007035869560793111,twitter_rel_freq:0.000028186171864083482,wikipedia_rel_freq:0.00008073395895827423},彩:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00009699039183224737,news_rel_freq:0.00009720354227927672,twitter_rel_freq:0.00011844189240758484,wikipedia_rel_freq:0.00011390140310996448},摩:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00015326540988512555,news_rel_freq:0.00007287842850849063,twitter_rel_freq:0.00010984610949867994,wikipedia_rel_freq:0.00017271364690549487},励:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00005654697188537395,news_rel_freq:0.00005679090306645679,twitter_rel_freq:0.0000359823470605321,wikipedia_rel_freq:0.000037513804329895756},縦:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.0002719487977333384,aozora_rel_freq:0.00011412348327948194,news_rel_freq:0.00010776703790085316,twitter_rel_freq:0.000024288084265859168,wikipedia_rel_freq:0.00008397652209415541},輝:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00015670368333882227,news_rel_freq:0.00011493858538706101,twitter_rel_freq:0.00009725228802749371,wikipedia_rel_freq:0.00011433221535050215},蓄:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000048213529446753055,news_rel_freq:0.0000280078003177577,twitter_rel_freq:0.00001659186003346758,wikipedia_rel_freq:0.000025964722343174317},軸:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000028846531518303096,news_rel_freq:0.00004884405314930755,twitter_rel_freq:0.00001579225232101131,wikipedia_rel_freq:0.00008184157977788144},巡:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00013652082391288494,news_rel_freq:0.00019993111437901085,twitter_rel_freq:0.00008225964341893867,wikipedia_rel_freq:0.00017867491568950282},稼:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00004547456584804549,news_rel_freq:0.0001742492213540773,twitter_rel_freq:0.00013923169293144784,wikipedia_rel_freq:0.00004280081371968944},瞬:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00019769101095068727,news_rel_freq:0.0002535238949178344,twitter_rel_freq:0.0002961547065009906,wikipedia_rel_freq:0.000043969614975822706},砲:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00012389439597558058,news_rel_freq:0.00006716057308029788,twitter_rel_freq:0.00003398332777939143,wikipedia_rel_freq:0.0002696757166523065},噴:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0008221707838449766,aozora_rel_freq:0.000058625476176591744,news_rel_freq:0.0002996543895588471,twitter_rel_freq:0.0000582714120452506,wikipedia_rel_freq:0.00004198379997358101},誇:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00010924773956830748,news_rel_freq:0.000058341507928339575,twitter_rel_freq:0.00003318372006693516,wikipedia_rel_freq:0.00004471907532326694},祥:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000018162630955968614,news_rel_freq:0.000052623652500146824,twitter_rel_freq:0.00007516312497088928,wikipedia_rel_freq:0.00007300737966200392},牲:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00006334581769776861,news_rel_freq:0.00012550208100863745,twitter_rel_freq:0.0000228887707690607,wikipedia_rel_freq:0.000024857101523567106},秩:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.000049029390944240415,news_rel_freq:0.00003198122527633232,twitter_rel_freq:0.00003638215091676024,wikipedia_rel_freq:0.00003920263929650054},帝:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00021344490796169321,news_rel_freq:0.00005494955979297099,twitter_rel_freq:0.000045677590574064366,wikipedia_rel_freq:0.00046161404114368807},唆:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00001456895531227429,news_rel_freq:0.00004002498799734924,twitter_rel_freq:0.0000030984798857680423,wikipedia_rel_freq:0.000017562609060262083},阻:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000014549530038524592,news_rel_freq:0.00005116996044213172,twitter_rel_freq:0.000016192056177239445,wikipedia_rel_freq:0.00003674012672632663},泰:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00007651615330006458,news_rel_freq:0.00005553103661617704,twitter_rel_freq:0.000019990192811406723,wikipedia_rel_freq:0.00010956523967117998},賄:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000012645853211054085,news_rel_freq:0.00006250875849464954,twitter_rel_freq:0.00001659186003346758,wikipedia_rel_freq:0.00000860349888647718},撲:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.00004965099970423078,news_rel_freq:0.0002023539344757027,twitter_rel_freq:0.00003258401428259296,wikipedia_rel_freq:0.00006222432772428584},堀:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00011016072743454334,news_rel_freq:0.00009148568685108398,twitter_rel_freq:0.00010874664889405258,wikipedia_rel_freq:0.0001566384872082726},菊:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.000162142759988738,news_rel_freq:0.0000940054197516435,twitter_rel_freq:0.00005057518781285901,wikipedia_rel_freq:0.00010867429956426923},絞:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.000049612149156731385,news_rel_freq:0.00006241184569078187,twitter_rel_freq:0.00003718175862921651,wikipedia_rel_freq:0.000024620027332028623},縁:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00042821073453836594,news_rel_freq:0.000045549017817806645,twitter_rel_freq:0.00006706709688226955,wikipedia_rel_freq:0.0001007476092568616},唯:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.0003225760958875025,news_rel_freq:0.00005310821651948519,twitter_rel_freq:0.00006706709688226955,wikipedia_rel_freq:0.00011221894110549783},膨:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00003102216217826939,news_rel_freq:0.00006260567129851721,twitter_rel_freq:0.00002458793715803027,wikipedia_rel_freq:0.000023549369692822577},矢:{jlpt_level:1,joyo_grade:2,frequency:1500,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00032467402545247,news_rel_freq:0.00009138877404721631,twitter_rel_freq:0.00013453399762076724,wikipedia_rel_freq:0.0002078426888033019},耐:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00005712973009786492,news_rel_freq:0.00006183036886757583,twitter_rel_freq:0.00010125032658977506,wikipedia_rel_freq:0.00006298398481115109},塾:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.000040346293578124934,news_rel_freq:0.000022968334516638667,twitter_rel_freq:0.00011434390288124646,wikipedia_rel_freq:0.00007762650261972144},漏:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00003628641136443783,news_rel_freq:0.00008712461067703866,twitter_rel_freq:0.00006406856796055855,wikipedia_rel_freq:0.000022612544258517282},慶:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00006907627345392983,news_rel_freq:0.00008169749366044893,twitter_rel_freq:0.00005777165722496543,wikipedia_rel_freq:0.0001895548366517205},猛:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00010359498490714506,news_rel_freq:0.00005814768232060422,twitter_rel_freq:0.000039580581766585315,wikipedia_rel_freq:0.00004435709107382109},芳:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00008199408049747971,news_rel_freq:0.000043707674544320845,twitter_rel_freq:0.000027186662223513144,wikipedia_rel_freq:0.00009180124500735294},懲:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.000028011244747066035,news_rel_freq:0.00013655014064955227,twitter_rel_freq:0.0000115943118306159,wikipedia_rel_freq:0.000023202680552508234},剣:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0001990702053869159,news_rel_freq:0.00003440404537302416,twitter_rel_freq:0.00017431448131546663,wikipedia_rel_freq:0.00017605945202801376},彰:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.0000069930985498916594,news_rel_freq:0.0000784993711328157,twitter_rel_freq:0.000017191565817809783,wikipedia_rel_freq:0.00008602479212535079},棋:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.000025777338265850644,news_rel_freq:0.0001437216881357601,twitter_rel_freq:0.00001549239942884021,wikipedia_rel_freq:0.00009387883066438374},丁:{jlpt_level:1,joyo_grade:3,frequency:1500,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.0003552882568819957,news_rel_freq:0.00015069941001423262,twitter_rel_freq:0.0003616225879583476,wikipedia_rel_freq:0.00035867030913402644},恒:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00003038112814452932,news_rel_freq:0.0000829573601107287,twitter_rel_freq:0.00003618224898864617,wikipedia_rel_freq:0.00007512957605400161},揚:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00015903471618878616,news_rel_freq:0.00006512540419907673,twitter_rel_freq:0.00014263002570938697,wikipedia_rel_freq:0.00006846473224994396},冒:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00005854777508159295,news_rel_freq:0.00005494955979297099,twitter_rel_freq:0.000024088182337745103,wikipedia_rel_freq:0.00010109174921232068},之:{jlpt_level:1,frequency:1500,nhk_rel_freq:0.00009486585967442038,aozora_rel_freq:0.0009654166800862932,news_rel_freq:0.0002131112557050145,twitter_rel_freq:0.00013623316400973682,wikipedia_rel_freq:0.00046863577082748107},倫:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00006398685173150868,news_rel_freq:0.00003479169658849486,twitter_rel_freq:0.00002878587764842568,wikipedia_rel_freq:0.00005082182386674142},陳:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00007898316306627636,news_rel_freq:0.00006066741522116374,twitter_rel_freq:0.000010194998333817429,wikipedia_rel_freq:0.00004803683941237807},憶:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00019782698786693516,news_rel_freq:0.00005068539642279335,twitter_rel_freq:0.0001230396367542084,wikipedia_rel_freq:0.00006885730671765284},潜:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.0001372978348628729,news_rel_freq:0.000043998412955923866,twitter_rel_freq:0.00003878097405412905,wikipedia_rel_freq:0.0001428002372215344},梨:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000265624407088377,aozora_rel_freq:0.00003102216217826939,news_rel_freq:0.00014110504243133293,twitter_rel_freq:0.0001611209540599382,wikipedia_rel_freq:0.00015080977603673776},仁:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00010460509914212941,news_rel_freq:0.00017221405247285618,twitter_rel_freq:0.00005747180433279433,wikipedia_rel_freq:0.0002088432438589885},克:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00003727710032567248,news_rel_freq:0.00007985615038696314,twitter_rel_freq:0.000018091124494323084,wikipedia_rel_freq:0.0000751091825751596},岳:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.00010007901035844952,news_rel_freq:0.00008848138993118609,twitter_rel_freq:0.00003768151344950167,wikipedia_rel_freq:0.00011444437948413326},概:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000190931015685792,news_rel_freq:0.00004176941846696737,twitter_rel_freq:0.00004397842418509479,wikipedia_rel_freq:0.00048170161780307775},拘:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00009959337851470705,news_rel_freq:0.0001187181847379003,twitter_rel_freq:0.00001679176196158165,wikipedia_rel_freq:0.000031398309862145016},墓:{jlpt_level:1,joyo_grade:5,frequency:1500,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00017770240426224696,news_rel_freq:0.00004632432024874803,twitter_rel_freq:0.000028386073792197547,wikipedia_rel_freq:0.00009761975943946677},黙:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.0004135835034048426,news_rel_freq:0.000047681099502895465,twitter_rel_freq:0.00011644287312644417,wikipedia_rel_freq:0.000032243364641661215},須:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00010402234092963843,news_rel_freq:0.00010185535686492507,twitter_rel_freq:0.00021339530826176677,wikipedia_rel_freq:0.00019268523565397054},偏:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.0000452414625630491,news_rel_freq:0.000019576386381270088,twitter_rel_freq:0.0000484762175676613,wikipedia_rel_freq:0.00004200929182213354},雰:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00003446043563196612,news_rel_freq:0.00003692377827358368,twitter_rel_freq:0.0001073473353972541,wikipedia_rel_freq:0.000018403840062495406},遇:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00013875473039410034,news_rel_freq:0.0000449675409946006,twitter_rel_freq:0.00008635763294527704,wikipedia_rel_freq:0.00004198507456600864},諮:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000003632526191193723,news_rel_freq:0.00003556699901943625,twitter_rel_freq:8.995586765133026e-7,wikipedia_rel_freq:0.000007033201015641642},狭:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.00013879358094159974,news_rel_freq:0.000037311429489054377,twitter_rel_freq:0.00009405385717766864,wikipedia_rel_freq:0.00008041531085136767},卓:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00018591929505836966,news_rel_freq:0.00008111601683724289,twitter_rel_freq:0.00006396861699650152,wikipedia_rel_freq:0.00007802417545714082},亀:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.00007570029180257722,news_rel_freq:0.00008121292964111056,twitter_rel_freq:0.00025337569388458024,wikipedia_rel_freq:0.00011918586331490291},糧:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.0000410844539806135,news_rel_freq:0.000010757321229311782,twitter_rel_freq:0.00000829593001673379,wikipedia_rel_freq:0.000022847069265200512},簿:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00002212538680090722,news_rel_freq:0.0000353731734117009,twitter_rel_freq:0.00003038509307333822,wikipedia_rel_freq:0.00004234450963059924},炉:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.00008284879254246646,news_rel_freq:0.00009129186124334863,twitter_rel_freq:0.000010394900261931496,wikipedia_rel_freq:0.00003239504114054874},牧:{jlpt_level:1,joyo_grade:4,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00013654024918663464,news_rel_freq:0.00006221802008304652,twitter_rel_freq:0.00011074566817519325,wikipedia_rel_freq:0.00015779581713255725},殊:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00024203891092125022,news_rel_freq:0.00005087922203052869,twitter_rel_freq:0.00001989024184734969,wikipedia_rel_freq:0.00010663877545735011},殖:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00005233168748168925,news_rel_freq:0.00005805076951673655,twitter_rel_freq:0.000012693772435243269,wikipedia_rel_freq:0.00005792767665075776},艦:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00010007901035844952,news_rel_freq:0.00007249077729301994,twitter_rel_freq:0.0000939539062136116,wikipedia_rel_freq:0.0007266285732881654},輩:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.00017805205918974154,news_rel_freq:0.00003837747033159879,twitter_rel_freq:0.0008666748093385385,wikipedia_rel_freq:0.00005962160998707304},穴:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00024665123515349294,aozora_rel_freq:0.0002113081278492263,news_rel_freq:0.0000527205653040145,twitter_rel_freq:0.00010045071887731879,wikipedia_rel_freq:0.00007281619079785998},奇:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00033388160520982736,news_rel_freq:0.00003440404537302416,twitter_rel_freq:0.00012703767531648972,wikipedia_rel_freq:0.00012240548378708683},慢:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00016468747084994858,news_rel_freq:0.000033144178922744405,twitter_rel_freq:0.00027546485694118463,wikipedia_rel_freq:0.000030294512819820685},鶴:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.0001727878100035731,news_rel_freq:0.00010660408425444108,twitter_rel_freq:0.0001582223761022842,wikipedia_rel_freq:0.0001640247503263667},謀:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00008488844628618486,news_rel_freq:0.0000376021679006574,twitter_rel_freq:0.000024188133301802135,wikipedia_rel_freq:0.00007649211535913408},暖:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00030989514160310655,aozora_rel_freq:0.00010814049896457463,news_rel_freq:0.00006648218345322416,twitter_rel_freq:0.00006286915639187415,wikipedia_rel_freq:0.00002916012555923332},昌:{jlpt_level:1,frequency:1500,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.00006905684818018014,news_rel_freq:0.00007326607972396132,twitter_rel_freq:0.000013593331111756572,wikipedia_rel_freq:0.00012746816490961826},拍:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.00008694752530365296,news_rel_freq:0.00004322311052498247,twitter_rel_freq:0.000025187642942372473,wikipedia_rel_freq:0.00002378899306921631},朗:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000057052029002866124,news_rel_freq:0.00007791789430960966,twitter_rel_freq:0.00003588239609647507,wikipedia_rel_freq:0.00009493674237931353},寛:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00010310935306340257,news_rel_freq:0.00005368969334269123,twitter_rel_freq:0.000016691810997524616,wikipedia_rel_freq:0.00012280188203207858},覆:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00007890546197127756,news_rel_freq:0.000100983141630116,twitter_rel_freq:0.00006756685170255472,wikipedia_rel_freq:0.00004849824187117877},胞:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00023400245386357023,aozora_rel_freq:0.000030322852323280224,news_rel_freq:0.00014062047841199456,twitter_rel_freq:0.000011394409902501833,wikipedia_rel_freq:0.00009178977367550432},泣:{jlpt_level:1,joyo_grade:4,frequency:1500,nhk_rel_freq:0.00008854146902945901,aozora_rel_freq:0.00048782689967619234,news_rel_freq:0.00003256270209953836,twitter_rel_freq:0.0009803190554713858,wikipedia_rel_freq:0.0000367923850158593},隔:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00009370752056854823,news_rel_freq:0.0000656099682184151,twitter_rel_freq:0.000023288574625288834,wikipedia_rel_freq:0.00005801562352826397},浄:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00007278650074012236,news_rel_freq:0.00003479169658849486,twitter_rel_freq:0.000021689359200376297,wikipedia_rel_freq:0.00006048195987572076},没:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00008277109144746766,news_rel_freq:0.00010369670013841086,twitter_rel_freq:0.00009635272935098041,wikipedia_rel_freq:0.0004937681843154155},暇:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0001189992269906564,news_rel_freq:0.0000169597406768429,twitter_rel_freq:0.0012713762628054676,wikipedia_rel_freq:0.00002402351807589954},肺:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00013913659418914989,aozora_rel_freq:0.00003593675643694325,news_rel_freq:0.00005960137437861933,twitter_rel_freq:0.0000228887707690607,wikipedia_rel_freq:0.000022402236507958952},貞:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.0001231756608468417,news_rel_freq:0.000029946056395111177,twitter_rel_freq:0.000048176364675490205,wikipedia_rel_freq:0.0001040934143793805},靖:{jlpt_level:1,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00000596355904115761,news_rel_freq:0.000034597870980759515,twitter_rel_freq:0.000012194017614958102,wikipedia_rel_freq:0.00004641555784443748},鑑:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00006759995264895271,news_rel_freq:0.00008479870338421449,twitter_rel_freq:0.00008605778005310595,wikipedia_rel_freq:0.0001454985493908192},飼:{jlpt_level:1,joyo_grade:5,frequency:1500,nhk_rel_freq:0.00017708293805891801,aozora_rel_freq:0.00007323328203636543,news_rel_freq:0.00008644622104996495,twitter_rel_freq:0.0000888564070467029,wikipedia_rel_freq:0.00006548855893143666},陰:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00021274559810670403,news_rel_freq:0.00003110901004152326,twitter_rel_freq:0.0000856579761968778,wikipedia_rel_freq:0.00009287572642384188},銘:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00005499294998539802,news_rel_freq:0.00007161856205821086,twitter_rel_freq:0.00001879078124272232,wikipedia_rel_freq:0.000042861994156215496},随:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.0002255662787815054,news_rel_freq:0.000020448601616079154,twitter_rel_freq:0.00002958548536088195,wikipedia_rel_freq:0.00005334934065072428},烈:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00015553816691384032,news_rel_freq:0.000031012097237655584,twitter_rel_freq:0.000041579601047725984,wikipedia_rel_freq:0.00004070410917624426},尋:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00021810697366162098,news_rel_freq:0.00003847438313546646,twitter_rel_freq:0.000032184210426364825,wikipedia_rel_freq:0.00005968151583117148},稿:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00010753831547833397,news_rel_freq:0.00008780300030411238,twitter_rel_freq:0.00016192056177239447,wikipedia_rel_freq:0.0002920269694631604},丹:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00015456690322635536,news_rel_freq:0.000060279764005693044,twitter_rel_freq:0.00007336400761786268,wikipedia_rel_freq:0.00011598026335942289},啓:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00006208317490403817,news_rel_freq:0.0000527205653040145,twitter_rel_freq:0.00001899068317083639,wikipedia_rel_freq:0.00007513594901613975},也:{jlpt_level:1,frequency:1500,nhk_rel_freq:0.0001201634222542658,aozora_rel_freq:0.00013275232080544333,news_rel_freq:0.00021097917401992567,twitter_rel_freq:0.0001311356648428281,wikipedia_rel_freq:0.00023638336244270888},丘:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.00010944199230580447,news_rel_freq:0.0000523329140885438,twitter_rel_freq:0.00015082600476206375,wikipedia_rel_freq:0.00015700684441985658},棟:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00004067652323186982,news_rel_freq:0.00007975923758309546,twitter_rel_freq:0.000045177835753779196,wikipedia_rel_freq:0.00005252213016519484},壌:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000006274363421152794,news_rel_freq:0.000026844846671345615,twitter_rel_freq:0.0000029985289217110087,wikipedia_rel_freq:0.000017215919919947743},漫:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00020870489128372482,aozora_rel_freq:0.000058567200355342645,news_rel_freq:0.00006890500354991601,twitter_rel_freq:0.00012983630231008667,wikipedia_rel_freq:0.0004029738673258872},玄:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00026775797336585176,news_rel_freq:0.00005301130371561752,twitter_rel_freq:0.00007786180100042918,wikipedia_rel_freq:0.00007108784346599878},粘:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00002132895057716956,news_rel_freq:0.000049813181187984286,twitter_rel_freq:0.00003188435753419373,wikipedia_rel_freq:0.000023920276089261812},悟:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.0001578497744900545,news_rel_freq:0.00003605156303877462,twitter_rel_freq:0.0000811601828143113,wikipedia_rel_freq:0.000060865612196436266},舗:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000017482746374729148,news_rel_freq:0.00011396945734838428,twitter_rel_freq:0.00008695733872961925,wikipedia_rel_freq:0.00013479324759118632},妊:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.000014199875111030008,news_rel_freq:0.000053786606146558906,twitter_rel_freq:0.000039980385622813446,wikipedia_rel_freq:0.00002275657320283905},熟:{jlpt_level:1,joyo_grade:6,frequency:1500,aozora_rel_freq:0.0001088980846408129,news_rel_freq:0.000028395451533228395,twitter_rel_freq:0.00005607249083599586,wikipedia_rel_freq:0.00004865884051705968},恩:{jlpt_level:1,joyo_grade:5,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.0001147839425869717,news_rel_freq:0.0000722000388814169,twitter_rel_freq:0.00003238411235447889,wikipedia_rel_freq:0.00005154196858835025},騰:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00004265790115433912,news_rel_freq:0.00002771706190615468,twitter_rel_freq:0.000009295439657304127,wikipedia_rel_freq:0.000010460580053528625},往:{jlpt_level:1,joyo_grade:5,frequency:1500,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.00043893348564819984,news_rel_freq:0.000051945262873073107,twitter_rel_freq:0.00004237920876018225,wikipedia_rel_freq:0.0000754150847577899},豆:{jlpt_level:1,joyo_grade:3,frequency:1500,nhk_rel_freq:0.00022135367257364753,aozora_rel_freq:0.0001354912844041509,news_rel_freq:0.00007568889982065317,twitter_rel_freq:0.00022528947298455378,wikipedia_rel_freq:0.00008488530649505293},遂:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.0001907950387695441,news_rel_freq:0.00007627037664385921,twitter_rel_freq:0.000040779993335269715,wikipedia_rel_freq:0.00005075044669079435},狂:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00029015531399925477,news_rel_freq:0.000017928868715519637,twitter_rel_freq:0.00012563836181969125,wikipedia_rel_freq:0.000054708056178573856},岐:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.00005258421604043534,news_rel_freq:0.0001906274852077142,twitter_rel_freq:0.00024038206855716586,wikipedia_rel_freq:0.0002524100876276813},陛:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.000022669294465898797,news_rel_freq:0.00013073537241749183,twitter_rel_freq:0.000005497303023136849,wikipedia_rel_freq:0.000006068334547928571},緯:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.000011558037881070937,news_rel_freq:0.0005014268472113437,twitter_rel_freq:0.00003548259224024693,wikipedia_rel_freq:0.00020747688077657318},培:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00001600642556975202,news_rel_freq:0.00002713558508294864,twitter_rel_freq:0.000015892203285068347,wikipedia_rel_freq:0.00004334506468628585},衰:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00009188154483607652,news_rel_freq:0.000021611555262491236,twitter_rel_freq:0.000013193527255528438,wikipedia_rel_freq:0.000033645416312050094},艇:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00007298075347761935,news_rel_freq:0.000013180141326003625,twitter_rel_freq:0.00000829593001673379,wikipedia_rel_freq:0.00010207445997402051},屈:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00021868973187411195,news_rel_freq:0.000052623652500146824,twitter_rel_freq:0.00004957567817228868,wikipedia_rel_freq:0.000039132536712981097},径:{jlpt_level:1,joyo_grade:4,frequency:1500,nhk_rel_freq:0.0001644341567689953,aozora_rel_freq:0.000042696751701838524,news_rel_freq:0.0002798841775698417,twitter_rel_freq:0.000007596273268334555,wikipedia_rel_freq:0.00008400838690484606},淡:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00011037440544579003,news_rel_freq:0.000032756527707273715,twitter_rel_freq:0.00005167464841748638,wikipedia_rel_freq:0.000056115206218673235},抽:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00007871120923378057,news_rel_freq:0.00003682686546971601,twitter_rel_freq:0.00003888092501818608,wikipedia_rel_freq:0.000030392656436747905},披:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000027195383249578675,news_rel_freq:0.00012918476755560904,twitter_rel_freq:0.000025287593906429505,wikipedia_rel_freq:0.00005666965392469065},廷:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00007810902574753989,news_rel_freq:0.00005146069885373474,twitter_rel_freq:0.0000024987741014258404,wikipedia_rel_freq:0.000049877350877870375},錦:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.000047553070139263284,news_rel_freq:0.00022396548973819394,twitter_rel_freq:0.000214094965010166,wikipedia_rel_freq:0.000049981867456935725},准:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000004487238236180482,news_rel_freq:0.00004448297697526223,twitter_rel_freq:0.0000034982837419961766,wikipedia_rel_freq:0.000035047467982438966},暑:{jlpt_level:1,joyo_grade:3,frequency:1500,nhk_rel_freq:0.0002909219696682225,aozora_rel_freq:0.00012768232435677188,news_rel_freq:0.00003188431247246465,twitter_rel_freq:0.0005603251045037305,wikipedia_rel_freq:0.000011289065131485686},奨:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.000021464927493417453,news_rel_freq:0.00006628835784548881,twitter_rel_freq:0.000021189604380091126,wikipedia_rel_freq:0.00005181728055271752},浸:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000058644901450341446,news_rel_freq:0.000042447808094041087,twitter_rel_freq:0.000051574697453429345,wikipedia_rel_freq:0.00002767012701133824},剰:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000017366194732230953,news_rel_freq:0.000023937462555315405,twitter_rel_freq:0.000016192056177239445,wikipedia_rel_freq:0.000026084534031371184},胆:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00009514499082602597,news_rel_freq:0.000025778805828801205,twitter_rel_freq:0.000013193527255528438,wikipedia_rel_freq:0.000021646403198376585},繊:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00002175630659966294,news_rel_freq:0.000016862827872975226,twitter_rel_freq:0.000011794213758729968,wikipedia_rel_freq:0.000025856381986826086},駒:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000129352897899246,news_rel_freq:0.000055046472596838665,twitter_rel_freq:0.00008625768198122002,wikipedia_rel_freq:0.00010112998698514947},虚:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00016921355963362845,news_rel_freq:0.00003934659837027553,twitter_rel_freq:0.00003938067983847124,wikipedia_rel_freq:0.000038993606138369834},霊:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.0002357451222263477,news_rel_freq:0.00007966232477922779,twitter_rel_freq:0.0001284369888132882,wikipedia_rel_freq:0.00016362197911923683},帳:{jlpt_level:1,joyo_grade:3,frequency:1500,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00016501770050369346,news_rel_freq:0.000036148475842642294,twitter_rel_freq:0.00004777656081926207,wikipedia_rel_freq:0.00006572180934569228},悔:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00010909233737830989,news_rel_freq:0.000058438420732207244,twitter_rel_freq:0.00030325122494904,wikipedia_rel_freq:0.000015102645674943423},諭:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000029817795205788048,news_rel_freq:0.00006512540419907673,twitter_rel_freq:0.000014592840752326908,wikipedia_rel_freq:0.000025988939599299217},惨:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00010316762888465168,news_rel_freq:0.00003081827162992024,twitter_rel_freq:0.00003038509307333822,wikipedia_rel_freq:0.000019535678138227517},虐:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00003838434092940533,news_rel_freq:0.00006754822429576857,twitter_rel_freq:0.000055072981195425525,wikipedia_rel_freq:0.00003776617363056575},翻:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.0000740491435338528,news_rel_freq:0.00001599061263816616,twitter_rel_freq:0.000013693282075813607,wikipedia_rel_freq:0.00011543983617010937},墜:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000027001130512081686,news_rel_freq:0.00009633132704446766,twitter_rel_freq:0.000008695733872961924,wikipedia_rel_freq:0.000035123943528096544},沼:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.0000986026895534724,news_rel_freq:0.00012773107549759395,twitter_rel_freq:0.0001730151187827252,wikipedia_rel_freq:0.0001759587592262313},据:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00009796165551973233,news_rel_freq:0.000060861240828899085,twitter_rel_freq:0.000006097008807479051,wikipedia_rel_freq:0.000013891782868698487},肥:{jlpt_level:1,joyo_grade:5,frequency:1500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00010153590588967696,news_rel_freq:0.000023355985732109364,twitter_rel_freq:0.00002508769197831544,wikipedia_rel_freq:0.00005930423647259411},徐:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00005848949926034385,news_rel_freq:0.00003740834229292205,twitter_rel_freq:0.000018091124494323084,wikipedia_rel_freq:0.0000473052233589206},糖:{jlpt_level:1,joyo_grade:6,frequency:1500,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.0000410261781593644,news_rel_freq:0.0000376021679006574,twitter_rel_freq:0.00006116999000290458,wikipedia_rel_freq:0.00004437875914509074},搭:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000002913791062454858,news_rel_freq:0.00006212110727917885,twitter_rel_freq:0.000020589898595748926,wikipedia_rel_freq:0.00019108307297244437},盾:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00008343155075495744,news_rel_freq:0.000013664705345341992,twitter_rel_freq:0.00002878587764842568,wikipedia_rel_freq:0.0000321261021383196},脈:{jlpt_level:1,joyo_grade:4,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00007896373779252665,news_rel_freq:0.00002093316563541752,twitter_rel_freq:0.000016691810997524616,wikipedia_rel_freq:0.00008407976408079314},滝:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.000080168104765008,news_rel_freq:0.00006105506643663444,twitter_rel_freq:0.00006996567483992354,wikipedia_rel_freq:0.0001102025358849931},軌:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.0000185122858834632,news_rel_freq:0.000023162160124374016,twitter_rel_freq:0.000008395880980790824,wikipedia_rel_freq:0.00015687938517709396},俵:{jlpt_level:1,joyo_grade:5,frequency:1500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00003861744421440172,news_rel_freq:0.00004361076174045317,twitter_rel_freq:0.000007496322304277521,wikipedia_rel_freq:0.000016842464338653254},妨:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000050253183190471454,news_rel_freq:0.00005213908848080845,twitter_rel_freq:0.00001629200714129648,wikipedia_rel_freq:0.000031398309862145016},擦:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000046912036105523215,news_rel_freq:0.000008237588328752265,twitter_rel_freq:0.000024987741014258404,wikipedia_rel_freq:0.000013351355679384957},鯨:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00010751464096434309,aozora_rel_freq:0.000026204694288344025,news_rel_freq:0.000021417729654755888,twitter_rel_freq:0.00000909553772919006,wikipedia_rel_freq:0.0000192629153587155},荘:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00010322590470590077,news_rel_freq:0.000023743636947580057,twitter_rel_freq:0.000034882886455904736,wikipedia_rel_freq:0.0000854423033859256},諾:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.000033430896123232073,news_rel_freq:0.000016087525442033837,twitter_rel_freq:0.00000359823470605321,wikipedia_rel_freq:0.000019772752329766},雷:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.00008912315596361926,news_rel_freq:0.00005611251343938308,twitter_rel_freq:0.00018241050940408636,wikipedia_rel_freq:0.0001267696882592791},漂:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00007616649837257,news_rel_freq:0.00002955840517964048,twitter_rel_freq:0.00001379323303987064,wikipedia_rel_freq:0.000018615422405481365},懐:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00020874399171426602,news_rel_freq:0.000019188735165799395,twitter_rel_freq:0.0003564251378273819,wikipedia_rel_freq:0.00003332676820514353},勘:{jlpt_level:1,joyo_grade:9,frequency:1500,aozora_rel_freq:0.00016161827759749613,news_rel_freq:0.000021223904047020543,twitter_rel_freq:0.00018021158819483163,wikipedia_rel_freq:0.000042292251341066565},栽:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.000021018146197174376,news_rel_freq:0.000019770211989005436,twitter_rel_freq:0.000015092595572612077,wikipedia_rel_freq:0.00003193873705145855},拐:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.000010586774193585984,news_rel_freq:0.000018510345538725678,twitter_rel_freq:0.000005497303023136849,wikipedia_rel_freq:0.000017684969933314203},駄:{jlpt_level:1,joyo_grade:9,frequency:1500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00029021358982050385,news_rel_freq:0.000026747933867477943,twitter_rel_freq:0.0002371836377073408,wikipedia_rel_freq:0.00002802956207592884},添:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.0001558683965675852,news_rel_freq:0.00009458689657484954,twitter_rel_freq:0.0000671670478463266,wikipedia_rel_freq:0.00005644405106500081},冠:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00008065373660875048,news_rel_freq:0.00010359978733454319,twitter_rel_freq:0.00002898577957653975,wikipedia_rel_freq:0.00009870826137265959},斜:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.00009774797750848564,news_rel_freq:0.000031205922845390936,twitter_rel_freq:0.00003008524018116712,wikipedia_rel_freq:0.00005560282006276748},鏡:{jlpt_level:1,joyo_grade:4,frequency:2000,nhk_rel_freq:0.0003162195322480679,aozora_rel_freq:0.00024403971411746922,news_rel_freq:0.00006231493288691419,twitter_rel_freq:0.00008335910402356603,wikipedia_rel_freq:0.00010196102124796179},聡:{jlpt_level:1,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.000015889873927253826,news_rel_freq:0.000027813974710022353,twitter_rel_freq:0.000008795684837018959,wikipedia_rel_freq:0.000038938798663981906},浪:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.000223915130512781,news_rel_freq:0.00006212110727917885,twitter_rel_freq:0.00012194017614958102,wikipedia_rel_freq:0.00008397524750172778},亜:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00006810500976644488,news_rel_freq:0.00006677292186482718,twitter_rel_freq:0.00006366876410433041,wikipedia_rel_freq:0.00022032349785461812},覧:{jlpt_level:1,joyo_grade:6,frequency:2000,nhk_rel_freq:0.00022767806321860888,aozora_rel_freq:0.00015687851080256957,news_rel_freq:0.000060570502417296065,twitter_rel_freq:0.00010274959105063056,wikipedia_rel_freq:0.0009363946220647553},詐:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00010751464096434309,aozora_rel_freq:0.000016919413435987877,news_rel_freq:0.00008334501132619939,twitter_rel_freq:0.00007326405665380564,wikipedia_rel_freq:0.00001559718753686241},壇:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0001350639283816575,news_rel_freq:0.000034694783784627184,twitter_rel_freq:0.00001679176196158165,wikipedia_rel_freq:0.00002743432741222738},勲:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00001769642438597584,news_rel_freq:0.0000339194813536858,twitter_rel_freq:0.000003398332777939143,wikipedia_rel_freq:0.0000903227177913065},魔:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.0002799181947331634,news_rel_freq:0.00002093316563541752,twitter_rel_freq:0.00041909439229114196,wikipedia_rel_freq:0.0004308007692058235},酬:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00002933216336204557,news_rel_freq:0.0000619272816714435,twitter_rel_freq:0.000013393429183642505,wikipedia_rel_freq:0.000016094278583636644},紫:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00014339737082027842,news_rel_freq:0.000025003503397859815,twitter_rel_freq:0.00013333458605208285,wikipedia_rel_freq:0.00008425438324337793},曙:{jlpt_level:1,frequency:2000,aozora_rel_freq:0.000017560447469727946,news_rel_freq:0.0000016475176657504531,twitter_rel_freq:0.000004997548202851681,wikipedia_rel_freq:0.000007976399412085065},紋:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00011503647114571779,news_rel_freq:0.000024906590593992143,twitter_rel_freq:0.000016092105213182413,wikipedia_rel_freq:0.00008159813262420483},卸:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.000024572971293369303,news_rel_freq:0.000018510345538725678,twitter_rel_freq:0.000016092105213182413,wikipedia_rel_freq:0.000016943157140435728},奮:{jlpt_level:1,joyo_grade:6,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00012616715300429535,news_rel_freq:0.0000316904868647293,twitter_rel_freq:0.00007566287979117445,wikipedia_rel_freq:0.000022833048748496623},欄:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00005885857946158813,news_rel_freq:0.000011144972444782477,twitter_rel_freq:0.000017791271602151983,wikipedia_rel_freq:0.00004503644883774588},逸:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0001067030287070969,news_rel_freq:0.00006948648037312205,twitter_rel_freq:0.00001799117353026605,wikipedia_rel_freq:0.000058190242690848765},涯:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00012047554779563354,news_rel_freq:0.000015021484599489425,twitter_rel_freq:0.000013393429183642505,wikipedia_rel_freq:0.00007233057108293437},拓:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000028224922758312726,news_rel_freq:0.00006880809074604833,twitter_rel_freq:0.00005417342251891222,wikipedia_rel_freq:0.00009130415396057872},眼:{jlpt_level:1,joyo_grade:5,frequency:2000,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.0016330244883159505,news_rel_freq:0.000023840549751447733,twitter_rel_freq:0.00014023120257201818,wikipedia_rel_freq:0.0000985438389494958},獄:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00014271748623903894,news_rel_freq:0.000012404838895062235,twitter_rel_freq:0.00012423904832289278,wikipedia_rel_freq:0.00007491926830344328},尚:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00017288493637232158,news_rel_freq:0.00006250875849464954,twitter_rel_freq:0.000047576658891148,wikipedia_rel_freq:0.00010875969725692019},彫:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00009394062385354463,news_rel_freq:0.00003789290631226042,twitter_rel_freq:0.00001549239942884021,wikipedia_rel_freq:0.00003832826889114893},穏:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0000638703000890105,news_rel_freq:0.000020254776008343805,twitter_rel_freq:0.000031784406570136694,wikipedia_rel_freq:0.00002045848305582892},顕:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.00008597626161616801,news_rel_freq:0.00002791088751389003,twitter_rel_freq:0.000009295439657304127,wikipedia_rel_freq:0.00006599202294034904},巧:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00013914323586909432,news_rel_freq:0.000022096119281829605,twitter_rel_freq:0.000011794213758729968,wikipedia_rel_freq:0.000023118557452284902},矛:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00008063431133500078,news_rel_freq:0.000008722152348090634,twitter_rel_freq:0.000024288084265859168,wikipedia_rel_freq:0.000016354295438872398},垣:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.00013036301213423035,news_rel_freq:0.00009875414714115951,twitter_rel_freq:0.00005397352059079815,wikipedia_rel_freq:0.00009294327982250608},欺:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00010751464096434309,aozora_rel_freq:0.000052020883101694066,news_rel_freq:0.00007345990533169667,twitter_rel_freq:0.00007376381147409081,wikipedia_rel_freq:0.00001652126704689144},釣:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00015285747913638186,news_rel_freq:0.000022580683301167974,twitter_rel_freq:0.00019040658652864903,wikipedia_rel_freq:0.000038301502450168777},粛:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000040773649600618316,news_rel_freq:0.00003440404537302416,twitter_rel_freq:0.00000829593001673379,wikipedia_rel_freq:0.000021385111750713205},愚:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0001621233347149883,news_rel_freq:0.000005814768232060422,twitter_rel_freq:0.0000725643999054064,wikipedia_rel_freq:0.000016841189746225626},嘉:{jlpt_level:1,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00006350121988776621,news_rel_freq:0.00005756620549739818,twitter_rel_freq:0.00001629200714129648,wikipedia_rel_freq:0.00009484752090937969},遭:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000040695948505619515,news_rel_freq:0.000057469292693530506,twitter_rel_freq:0.00007426356629437598,wikipedia_rel_freq:0.00004240059169741479},架:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000053477778632921495,news_rel_freq:0.00005853533353607492,twitter_rel_freq:0.00003668200380893134,wikipedia_rel_freq:0.00013172402902546232},鬼:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.0001517853754790726,aozora_rel_freq:0.00018964894761831186,news_rel_freq:0.0000376021679006574,twitter_rel_freq:0.00023788329445574002,wikipedia_rel_freq:0.0001533984732572467},庶:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000023310328499638863,news_rel_freq:0.00000445798897791299,twitter_rel_freq:0.000007396371340220488,wikipedia_rel_freq:0.000024052833701734943},稚:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00004763077123426208,news_rel_freq:0.00004390150015205619,twitter_rel_freq:0.00005367366769862705,wikipedia_rel_freq:0.000086365108303527},滋:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.000014860334418519776,news_rel_freq:0.00008373266254167008,twitter_rel_freq:0.00011844189240758484,wikipedia_rel_freq:0.00008998240161313029},幻:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00011019957798204273,news_rel_freq:0.00003178739966859698,twitter_rel_freq:0.000048576168531718336,wikipedia_rel_freq:0.00008134576332353483},煮:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00013913659418914989,aozora_rel_freq:0.00009815590825722933,news_rel_freq:0.000010272757209973413,twitter_rel_freq:0.00011044581528302215,wikipedia_rel_freq:0.00001715856326070456},姫:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00015810976612403395,aozora_rel_freq:0.00018102412607344547,news_rel_freq:0.00005805076951673655,twitter_rel_freq:0.00023078677600769064,wikipedia_rel_freq:0.00018867281869180312},誓:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00006291846167527524,news_rel_freq:0.00006202419447531117,twitter_rel_freq:0.000018291026422437153,wikipedia_rel_freq:0.00003052648864164866},把:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00004658180645177833,news_rel_freq:0.000060279764005693044,twitter_rel_freq:0.000032683965246649996,wikipedia_rel_freq:0.000018146372392114905},践:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000033022965374488394,news_rel_freq:0.000007365373093943202,twitter_rel_freq:0.00001679176196158165,wikipedia_rel_freq:0.00002497181484205347},呈:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0000368691695769288,news_rel_freq:0.000029461492375772808,twitter_rel_freq:0.00000939539062136116,wikipedia_rel_freq:0.00002272853216943127},疎:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00004976755134672897,news_rel_freq:0.000020448601616079154,twitter_rel_freq:0.000017791271602151983,wikipedia_rel_freq:0.000021898772499046582},仰:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00039577052737636853,news_rel_freq:0.000021030078439285195,twitter_rel_freq:0.000020789800523862992,wikipedia_rel_freq:0.00006364549828108911},剛:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000057013178455366726,news_rel_freq:0.00005582177502778006,twitter_rel_freq:0.00008415871173602231,wikipedia_rel_freq:0.00009890837238379692},疾:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00006319041550777102,news_rel_freq:0.00003265961490340604,twitter_rel_freq:0.00001789122256620902,wikipedia_rel_freq:0.000045490203741980826},征:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00007643845220506578,news_rel_freq:0.00003992807519348157,twitter_rel_freq:0.00007376381147409081,wikipedia_rel_freq:0.00009355380959533904},砕:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.000053069847884177815,news_rel_freq:0.0000298491435912435,twitter_rel_freq:0.00001899068317083639,wikipedia_rel_freq:0.000022454494797491627},謡:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00005023375791672175,news_rel_freq:0.00000678389627073716,twitter_rel_freq:0.000020589898595748926,wikipedia_rel_freq:0.00005278087242800297},嫁:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00015070127375016527,news_rel_freq:0.000011435710856385497,twitter_rel_freq:0.00008905630897481696,wikipedia_rel_freq:0.000039138909675119225},謙:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00005660524770662304,news_rel_freq:0.00003411330696142114,twitter_rel_freq:0.000021989212092547395,wikipedia_rel_freq:0.00004371597108272509},后:{jlpt_level:1,joyo_grade:6,frequency:2000,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.000039064225510644796,news_rel_freq:0.00005853533353607492,twitter_rel_freq:0.0000026986760295399076,wikipedia_rel_freq:0.000047144624713039696},嘆:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0001235058905005866,news_rel_freq:0.000010757321229311782,twitter_rel_freq:0.000009695243513532262,wikipedia_rel_freq:0.00001487959200010883},菌:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.000015307115714762856,news_rel_freq:0.000033047266118876735,twitter_rel_freq:0.000037381660557330575,wikipedia_rel_freq:0.00006481939790693288},鎌:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.0000758926877395363,aozora_rel_freq:0.00008591798579491892,news_rel_freq:0.000027329410690683984,twitter_rel_freq:0.00010135027755383209,wikipedia_rel_freq:0.0000957320880541523},巣:{jlpt_level:1,joyo_grade:4,frequency:2000,nhk_rel_freq:0.00018340732870387937,aozora_rel_freq:0.00009201752175232442,news_rel_freq:0.000053495867734955886,twitter_rel_freq:0.00009145513211218576,wikipedia_rel_freq:0.00005359661158168377},頻:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00006458903521774936,news_rel_freq:0.000019576386381270088,twitter_rel_freq:0.000024987741014258404,wikipedia_rel_freq:0.000039216659813204425},琴:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.0000738937413438552,news_rel_freq:0.000052623652500146824,twitter_rel_freq:0.000028286122828140515,wikipedia_rel_freq:0.00006036469737237915},班:{jlpt_level:1,joyo_grade:6,frequency:2000,aozora_rel_freq:0.00002834147440081092,news_rel_freq:0.0000206424272238145,twitter_rel_freq:0.000034383131635619566,wikipedia_rel_freq:0.00003937980764394059},棚:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00011670704468819191,news_rel_freq:0.000022774508908903322,twitter_rel_freq:0.00003968053273064235,wikipedia_rel_freq:0.000027037929167235617},潔:{jlpt_level:1,joyo_grade:5,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00008267396507871917,news_rel_freq:0.000009594367582899698,twitter_rel_freq:0.000021089653416034093,wikipedia_rel_freq:0.00002424402256587888},酷:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0000966018863572534,news_rel_freq:0.0000261664570442719,twitter_rel_freq:0.00009985101309297659,wikipedia_rel_freq:0.00003847867079760883},宰:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00005608076531538117,news_rel_freq:0.000012114100483459213,twitter_rel_freq:0.00009415380814172566,wikipedia_rel_freq:0.00003883555667734418},廊:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00015740299319381144,news_rel_freq:0.00001754121750004894,twitter_rel_freq:0.000024088182337745103,wikipedia_rel_freq:0.00002066241784424912},寂:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00019596216158696404,news_rel_freq:0.000020739340027682174,twitter_rel_freq:0.00022379020852369828,wikipedia_rel_freq:0.000011925086752871185},伏:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00021218226516796278,news_rel_freq:0.000051945262873073107,twitter_rel_freq:0.00008665748583744815,wikipedia_rel_freq:0.00009278395576905279},碁:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.00003570365315194686,news_rel_freq:0.00003527626060783323,twitter_rel_freq:0.000004997548202851681,wikipedia_rel_freq:0.00003407750314501539},俗:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00022482811837901684,news_rel_freq:0.000023743636947580057,twitter_rel_freq:0.00003848112116195794,wikipedia_rel_freq:0.000074623562860234},漠:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00006212202545153758,news_rel_freq:0.000006977721878472507,twitter_rel_freq:0.000007596273268334555,wikipedia_rel_freq:0.000023275332320882933},邪:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.000191125268423289,news_rel_freq:0.000019479473577402416,twitter_rel_freq:0.00036791949869394077,wikipedia_rel_freq:0.00004188310717179854},晶:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000054138237940411266,news_rel_freq:0.00003033370761058187,twitter_rel_freq:0.00002238901594877553,wikipedia_rel_freq:0.00007605110637917539},墨:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00007762339390379742,news_rel_freq:0.00003382256854981812,twitter_rel_freq:0.0000615697938591327,wikipedia_rel_freq:0.00003083876378641709},鎮:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00005893628055658693,news_rel_freq:0.00003198122527633232,twitter_rel_freq:0.00001709161485375275,wikipedia_rel_freq:0.00011092777897631244},洞:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00008187752885498151,news_rel_freq:0.000018219607127122657,twitter_rel_freq:0.00002068984955980596,wikipedia_rel_freq:0.00007921846856182663},履:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00006950362947642322,news_rel_freq:0.00004787492511063081,twitter_rel_freq:0.00013063591002254293,wikipedia_rel_freq:0.00010110322054416931},劣:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00009137648771858435,news_rel_freq:0.00003547008621556858,twitter_rel_freq:0.00002238901594877553,wikipedia_rel_freq:0.00003550122288667391},那:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00006956829709457494,aozora_rel_freq:0.0005237636561131356,news_rel_freq:0.00019450399736242112,twitter_rel_freq:0.00018301021518842857,wikipedia_rel_freq:0.00015802141999224709},殴:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.00002684572832208409,news_rel_freq:0.0000376021679006574,twitter_rel_freq:0.00008605778005310595,wikipedia_rel_freq:0.000017019632686093302},娠:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.000013791944362286328,news_rel_freq:0.00003566391182330392,twitter_rel_freq:0.000024188133301802135,wikipedia_rel_freq:0.000015682585229513366},奉:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00022480869310526714,news_rel_freq:0.00002694175947521329,twitter_rel_freq:0.00001329347821958547,wikipedia_rel_freq:0.00008120300897164069},憂:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0001252153145905601,news_rel_freq:0.000013373966933738971,twitter_rel_freq:0.00005757175529685136,wikipedia_rel_freq:0.000018795139937776667},朴:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000040171466114377644,news_rel_freq:0.0000976881062986151,twitter_rel_freq:0.000011394409902501833,wikipedia_rel_freq:0.00002300002035651566},亭:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0001745166593672963,news_rel_freq:0.000014827658991754077,twitter_rel_freq:0.00008865650511858881,wikipedia_rel_freq:0.00007221203398716513},怪:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00013913659418914989,aozora_rel_freq:0.000459835080202876,news_rel_freq:0.000038280557527731114,twitter_rel_freq:0.00020070153582652352,wikipedia_rel_freq:0.0002074450159658825},鳩:{jlpt_level:1,frequency:2000,aozora_rel_freq:0.00004283272861808642,news_rel_freq:0.000015312223011092447,twitter_rel_freq:0.00002068984955980596,wikipedia_rel_freq:0.000028459099724038885},酔:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.0002544710861210576,news_rel_freq:0.000023840549751447733,twitter_rel_freq:0.00024517971483190346,wikipedia_rel_freq:0.000029825462806454225},惜:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00018145148209593886,news_rel_freq:0.000026554108259742595,twitter_rel_freq:0.00004137969911961192,wikipedia_rel_freq:0.000012508850084724006},穫:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000018823090263458382,news_rel_freq:0.000022386857693432626,twitter_rel_freq:0.000026387054511056876,wikipedia_rel_freq:0.000009187262218330002},佳:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.000031896299497005844,news_rel_freq:0.00009051655881240725,twitter_rel_freq:0.00006516802856518593,wikipedia_rel_freq:0.00010145118427691128},潤:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00005316697425292631,news_rel_freq:0.000028298538729360722,twitter_rel_freq:0.000027986269935969413,wikipedia_rel_freq:0.00004715991982217121},悼:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000009071602841109458,news_rel_freq:0.00011232193968263383,twitter_rel_freq:0.000005697204951250917,wikipedia_rel_freq:0.00001611594665490629},乏:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00014423265759151547,news_rel_freq:0.000022677596105035647,twitter_rel_freq:0.00002678685836728501,wikipedia_rel_freq:0.000023720165078124493},該:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000010839302752332072,news_rel_freq:0.000024712764986256795,twitter_rel_freq:0.000005897106879364984,wikipedia_rel_freq:0.00031004843179736793},赴:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00003065308197702511,news_rel_freq:0.000006202419447531118,twitter_rel_freq:0.000005197450130965748,wikipedia_rel_freq:0.000026902822369907236},桑:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000044697554898057525,news_rel_freq:0.00003653612705811299,twitter_rel_freq:0.00004967562913634571,wikipedia_rel_freq:0.00007114902390252484},髄:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00003129411601076518,news_rel_freq:0.0000075591987016785494,twitter_rel_freq:0.0000052974010950227815,wikipedia_rel_freq:0.00001903603790659803},虎:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00008854146902945901,aozora_rel_freq:0.00009693211601099828,news_rel_freq:0.000014440007776283382,twitter_rel_freq:0.00007066533158832277,wikipedia_rel_freq:0.0000718462259604364},盆:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00006872661852643525,news_rel_freq:0.000014246182168548035,twitter_rel_freq:0.00003118470078579449,wikipedia_rel_freq:0.000024671011029133673},穂:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00006645386149772046,news_rel_freq:0.00006153963045597281,twitter_rel_freq:0.00007706219328797292,wikipedia_rel_freq:0.00012236979519911328},壮:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00010392521456088993,news_rel_freq:0.00002480967779012447,twitter_rel_freq:0.000023588427517459935,wikipedia_rel_freq:0.000027011162726255467},堤:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00008854146902945901,aozora_rel_freq:0.00005308927315792752,news_rel_freq:0.000022193032085697278,twitter_rel_freq:0.000021689359200376297,wikipedia_rel_freq:0.00004901062802708452},飢:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00003956928262813697,news_rel_freq:0.00000523329140885438,twitter_rel_freq:0.000011894164722787,wikipedia_rel_freq:0.000013264683394306372},傍:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00043028923882958375,news_rel_freq:0.000018219607127122657,twitter_rel_freq:0.0000115943118306159,wikipedia_rel_freq:0.0000389821348065212},疫:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.000011771715892317626,news_rel_freq:0.000025197329005595164,twitter_rel_freq:0.000010294949297874463,wikipedia_rel_freq:0.000025326151536933566},累:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000021115272565922872,news_rel_freq:0.000018122694323254985,twitter_rel_freq:0.000006996567483992353,wikipedia_rel_freq:0.000017238862583645018},痴:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00006542432198898642,news_rel_freq:0.0000065900706630018124,twitter_rel_freq:0.00008495831944847857,wikipedia_rel_freq:0.00001967460871283878},搬:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000014413553122276697,news_rel_freq:0.00012811872671306465,twitter_rel_freq:0.000011894164722787,wikipedia_rel_freq:0.000024546100971226302},癒:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0000472228404855184,news_rel_freq:0.000013955443756945014,twitter_rel_freq:0.00021349525922582382,wikipedia_rel_freq:0.000016453713648227247},寸:{jlpt_level:1,joyo_grade:6,frequency:2000,aozora_rel_freq:0.00030439403965778415,news_rel_freq:0.00000969128038676737,twitter_rel_freq:0.000024088182337745103,wikipedia_rel_freq:0.000032757025389994596},郭:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000027816992009569046,news_rel_freq:0.00001385853095307734,twitter_rel_freq:0.000007596273268334555,wikipedia_rel_freq:0.000033243919697347827},尿:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.000012684703758553482,news_rel_freq:0.000028395451533228395,twitter_rel_freq:0.000020589898595748926,wikipedia_rel_freq:0.000029459654779725493},凶:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00002913791062454858,news_rel_freq:0.000015021484599489425,twitter_rel_freq:0.000016491909069410547,wikipedia_rel_freq:0.000021968875082566025},吐:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00016493999940869468,news_rel_freq:0.000018122694323254985,twitter_rel_freq:0.00021899256224896065,wikipedia_rel_freq:0.00002521271281087483},宴:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000057110304824115216,news_rel_freq:0.000023355985732109364,twitter_rel_freq:0.0001495266422293223,wikipedia_rel_freq:0.000018781119421072778},賓:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.000014860334418519776,news_rel_freq:0.000014052356560812687,twitter_rel_freq:0.00000359823470605321,wikipedia_rel_freq:0.000007921591937697137},虜:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000019328147380950558,news_rel_freq:0.000011532623660253172,twitter_rel_freq:0.000004497793382566513,wikipedia_rel_freq:0.000025448512409985686},陶:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000057013178455366726,news_rel_freq:0.00000940054197516435,twitter_rel_freq:0.000025487495834543574,wikipedia_rel_freq:0.000033670908160602615},鐘:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00010751464096434309,aozora_rel_freq:0.00009429027878103921,news_rel_freq:0.000024228200966918426,twitter_rel_freq:0.000008795684837018959,wikipedia_rel_freq:0.00003074826772405563},憾:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00003504319384445709,news_rel_freq:0.000017444304696181268,twitter_rel_freq:0.000001799117353026605,wikipedia_rel_freq:0.0000024395699064766405},磁:{jlpt_level:1,joyo_grade:6,frequency:2000,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.00002649607339458951,news_rel_freq:0.000021611555262491236,twitter_rel_freq:0.00001299362532741437,wikipedia_rel_freq:0.00007214830436578383},弥:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00016078299082625906,news_rel_freq:0.00007094017243113715,twitter_rel_freq:0.00005387356962674112,wikipedia_rel_freq:0.00011143506676250769},昆:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000023582282332134653,news_rel_freq:0.00001492457179562175,twitter_rel_freq:0.000016092105213182413,wikipedia_rel_freq:0.000034233003421185795},粗:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00008537407812992735,news_rel_freq:0.00000784993711328157,twitter_rel_freq:0.000016491909069410547,wikipedia_rel_freq:0.000013344982717246826},訂:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000027467337082074462,news_rel_freq:0.00002820162592549305,twitter_rel_freq:0.000020389996667634857,wikipedia_rel_freq:0.00006277495165302039},芽:{jlpt_level:1,joyo_grade:4,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00007253397218137627,news_rel_freq:0.00001618443824590151,twitter_rel_freq:0.00002848602475625458,wikipedia_rel_freq:0.000031371543421164867},庄:{jlpt_level:1,frequency:2000,aozora_rel_freq:0.00012047554779563354,news_rel_freq:0.00002587571863266888,twitter_rel_freq:0.00004287896358046742,wikipedia_rel_freq:0.00009447406532808519},傘:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00007432109736634858,news_rel_freq:0.00007413829495877038,twitter_rel_freq:0.00017091614853752748,wikipedia_rel_freq:0.000042839051492518224},騎:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.000071970639242635,news_rel_freq:0.00003779599350839275,twitter_rel_freq:0.00004327876743669556,wikipedia_rel_freq:0.00017676302704806344},寧:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00014926380349268754,news_rel_freq:0.00003992807519348157,twitter_rel_freq:0.00004277901261641039,wikipedia_rel_freq:0.00004620525009387915},循:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.000010781026931082975,news_rel_freq:0.00001909182236193172,twitter_rel_freq:0.00000909553772919006,wikipedia_rel_freq:0.0000411234500849333},忍:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.00020897709499926242,news_rel_freq:0.000022580683301167974,twitter_rel_freq:0.00005217440323777155,wikipedia_rel_freq:0.00009154122815211719},怠:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000061772370524043,news_rel_freq:0.000024615852182389122,twitter_rel_freq:0.00003198430849825076,wikipedia_rel_freq:0.000008038854441038752},如:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.001015844690740512,news_rel_freq:0.000010660408425444108,twitter_rel_freq:0.00005397352059079815,wikipedia_rel_freq:0.00008176128045494099},寮:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000025330556969607567,news_rel_freq:0.000012307926091194561,twitter_rel_freq:0.00005777165722496543,wikipedia_rel_freq:0.000038157473505847014},鉛:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000047902725066757865,news_rel_freq:0.000006396245055266465,twitter_rel_freq:0.000018690830278665287,wikipedia_rel_freq:0.000023137676338699295},珠:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00008094511571499595,news_rel_freq:0.000022580683301167974,twitter_rel_freq:0.000028286122828140515,wikipedia_rel_freq:0.00005566527509172117},凝:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00011344359869824248,news_rel_freq:0.000006396245055266465,twitter_rel_freq:0.000017491418709980884,wikipedia_rel_freq:0.000014080422547987172},苗:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.000030245151228281426,news_rel_freq:0.000027038672279080964,twitter_rel_freq:0.00003188435753419373,wikipedia_rel_freq:0.00003798540352811747},獣:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00009632993252475761,news_rel_freq:0.000022386857693432626,twitter_rel_freq:0.00007736204618014403,wikipedia_rel_freq:0.00014791262744874331},哀:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0001969917010956981,news_rel_freq:0.00001618443824590151,twitter_rel_freq:0.00007616263461145962,wikipedia_rel_freq:0.000024714347171672965},跳:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00007327213258386483,news_rel_freq:0.00003227196368793534,twitter_rel_freq:0.00004048014044309862,wikipedia_rel_freq:0.0000346752869935721},匠:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00012556496951805467,news_rel_freq:0.00003372565574595045,twitter_rel_freq:0.0000689661651993532,wikipedia_rel_freq:0.000044044815929052655},垂:{jlpt_level:1,joyo_grade:6,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0001458255300389908,news_rel_freq:0.000017928868715519637,twitter_rel_freq:0.00004217930683206819,wikipedia_rel_freq:0.00004804831074422671},蛇:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0001437664510215227,news_rel_freq:0.000007753024309413896,twitter_rel_freq:0.000026287103546999843,wikipedia_rel_freq:0.000035050017167294216},澄:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00014133829180281032,news_rel_freq:0.000023355985732109364,twitter_rel_freq:0.00003668200380893134,wikipedia_rel_freq:0.0000464601685794044},縫:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00008803534063363612,news_rel_freq:0.000012889402914400603,twitter_rel_freq:0.000017491418709980884,wikipedia_rel_freq:0.00001354381913595652},僧:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.00029040784255800087,news_rel_freq:0.00001986712479287311,twitter_rel_freq:0.00001489269364449801,wikipedia_rel_freq:0.00006126201044142803},眺:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00035186940870204865,news_rel_freq:0.000014730746187886404,twitter_rel_freq:0.00004287896358046742,wikipedia_rel_freq:0.00001110424922947988},呉:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0002551315454285474,news_rel_freq:0.000032756527707273715,twitter_rel_freq:0.00004317881647263852,wikipedia_rel_freq:0.00006238365177773912},凡:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00022315754483654272,news_rel_freq:0.000026069544240404226,twitter_rel_freq:0.000024288084265859168,wikipedia_rel_freq:0.000045696687715256274},憩:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00001600642556975202,news_rel_freq:0.000018219607127122657,twitter_rel_freq:0.00022448986527209751,wikipedia_rel_freq:0.000011021400721684174},媛:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.000011460911512322443,news_rel_freq:0.00006328406092559093,twitter_rel_freq:0.00007356390954597674,wikipedia_rel_freq:0.00008294027845049528},溝:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00004998122935797567,news_rel_freq:0.000044386064171394555,twitter_rel_freq:0.000037781464413558706,wikipedia_rel_freq:0.000043495466592745746},恭:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00004689261083177352,news_rel_freq:0.000026069544240404226,twitter_rel_freq:0.00001599215424912538,wikipedia_rel_freq:0.000043791172035955036},刈:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00005279789405168203,news_rel_freq:0.00003004296919897885,twitter_rel_freq:0.000058471313973364665,wikipedia_rel_freq:0.00003225101219622698},睡:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00008968648890236053,news_rel_freq:0.000010175844406105739,twitter_rel_freq:0.000258673094979603,wikipedia_rel_freq:0.000013569310984509045},錯:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00005427421485665916,news_rel_freq:0.000021320816850888216,twitter_rel_freq:0.000020190094739520792,wikipedia_rel_freq:0.000017042575349790573},伯:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00020913249718926,news_rel_freq:0.000020448601616079154,twitter_rel_freq:0.00001819107545838012,wikipedia_rel_freq:0.00015251518070490168},穀:{jlpt_level:1,joyo_grade:6,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000047086863569270505,news_rel_freq:0.000010078931602238065,twitter_rel_freq:0.000008795684837018959,wikipedia_rel_freq:0.000015463355331961653},陵:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00003514032021320559,news_rel_freq:0.00002926766676803746,twitter_rel_freq:0.00002478783908614434,wikipedia_rel_freq:0.00006735201306062624},霧:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00011756175673317868,news_rel_freq:0.000021611555262491236,twitter_rel_freq:0.00009055557343567246,wikipedia_rel_freq:0.00006309232516749932},魂:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00021457157383917574,news_rel_freq:0.000021514642458623564,twitter_rel_freq:0.00008685738776556221,wikipedia_rel_freq:0.0000698361937020698},弊:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000029837220479537746,news_rel_freq:0.000008528326740355286,twitter_rel_freq:0.00001239391954307217,wikipedia_rel_freq:0.000009607877719446663},妃:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.000024980902042112983,news_rel_freq:0.00003324109172661208,twitter_rel_freq:0.000007096518448049387,wikipedia_rel_freq:0.000053631025577229674},舶:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00001313148505479656,news_rel_freq:0.000020448601616079154,twitter_rel_freq:0.000003898087598224311,wikipedia_rel_freq:0.00003128869491336916},餓:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00003943330571188908,news_rel_freq:0.000005039465801119032,twitter_rel_freq:0.000014193036896098774,wikipedia_rel_freq:0.000010942375991171347},窮:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0000964853347147552,news_rel_freq:0.00001124188524865015,twitter_rel_freq:0.0000059970578434220174,wikipedia_rel_freq:0.000014432210058012017},掌:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000094562232613535,news_rel_freq:0.000021320816850888216,twitter_rel_freq:0.00001519254653666911,wikipedia_rel_freq:0.00003232366396460167},麗:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0001746914868310436,news_rel_freq:0.00001599061263816616,twitter_rel_freq:0.0004556764451360163,wikipedia_rel_freq:0.00007788524488252957},綾:{jlpt_level:1,frequency:2000,aozora_rel_freq:0.00003727710032567248,news_rel_freq:0.0000298491435912435,twitter_rel_freq:0.00009085542632784356,wikipedia_rel_freq:0.00007148679089584579},臭:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00012492393548431462,news_rel_freq:0.000020448601616079154,twitter_rel_freq:0.00021129633801656906,wikipedia_rel_freq:0.000021768764071428705},悦:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00009671843799975158,news_rel_freq:0.000010660408425444108,twitter_rel_freq:0.000006996567483992353,wikipedia_rel_freq:0.000024552473933364434},刃:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00006503581651399244,news_rel_freq:0.00004060646482055528,twitter_rel_freq:0.000020789800523862992,wikipedia_rel_freq:0.000028285755153881715},縛:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00008135304646373964,news_rel_freq:0.000013373966933738971,twitter_rel_freq:0.00005567268697976773,wikipedia_rel_freq:0.00002103332424068836},暦:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00005198203255419467,news_rel_freq:0.000009497454779032023,twitter_rel_freq:0.000010294949297874463,wikipedia_rel_freq:0.00020226124856272657},宜:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00017173884522108933,news_rel_freq:0.00006822661392284228,twitter_rel_freq:0.0002514766255674966,wikipedia_rel_freq:0.00003727927932321253},盲:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00007649672802631487,news_rel_freq:0.000006686983466869486,twitter_rel_freq:0.000008195979052676757,wikipedia_rel_freq:0.000014775075421043478},粋:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00008455821663243999,news_rel_freq:0.000004845640193383685,twitter_rel_freq:0.000051574697453429345,wikipedia_rel_freq:0.00002937808086435741},辱:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00007309730512011753,news_rel_freq:0.000023743636947580057,twitter_rel_freq:0.000012094066650901068,wikipedia_rel_freq:0.000018160392908818794},轄:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000005477927197415133,news_rel_freq:0.000014052356560812687,twitter_rel_freq:0.0000037981366341672774,wikipedia_rel_freq:0.00008670032611199271},猿:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00020870489128372482,aozora_rel_freq:0.00012791542764176828,news_rel_freq:0.000015215310207224771,twitter_rel_freq:0.00005757175529685136,wikipedia_rel_freq:0.00004537549042349446},弦:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.000047339392128016596,news_rel_freq:0.00002791088751389003,twitter_rel_freq:0.000021489457272262228,wikipedia_rel_freq:0.00008637785422780326},窒:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.000011441486238572742,news_rel_freq:0.000013470879737606646,twitter_rel_freq:0.000003898087598224311,wikipedia_rel_freq:0.00001316016681524102},炊:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00003679146848193001,news_rel_freq:0.00000814067552488459,twitter_rel_freq:0.00006166974482318975,wikipedia_rel_freq:0.000009059802975567378},洪:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.000028205497484563027,news_rel_freq:0.0001308322852213595,twitter_rel_freq:0.00004777656081926207,wikipedia_rel_freq:0.00002950426551469241},摂:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000027972394199566638,news_rel_freq:0.000020836252831549847,twitter_rel_freq:0.00005387356962674112,wikipedia_rel_freq:0.00005453343701598906},飽:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00008591798579491892,news_rel_freq:0.00000261664570442719,twitter_rel_freq:0.00015082600476206375,wikipedia_rel_freq:0.000013492835438851471},冗:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00007443764900884678,news_rel_freq:0.000009012890759693655,twitter_rel_freq:0.000053373814806455955,wikipedia_rel_freq:0.000009610426904301917},桃:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.0000944456809710368,news_rel_freq:0.00006066741522116374,twitter_rel_freq:0.0001025496891225165,wikipedia_rel_freq:0.00010043915788937604},狩:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.000056644098254122444,news_rel_freq:0.000025003503397859815,twitter_rel_freq:0.00006816655748689693,wikipedia_rel_freq:0.00006957745143926168},朱:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00007537006214883232,news_rel_freq:0.000020836252831549847,twitter_rel_freq:0.000022588917876889598,wikipedia_rel_freq:0.00004720962892684863},渦:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00005567283456663749,news_rel_freq:0.00000784993711328157,twitter_rel_freq:0.000006396861699650152,wikipedia_rel_freq:0.000014568591447768025},紳:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0000884821219298792,news_rel_freq:0.000006202419447531118,twitter_rel_freq:0.000011394409902501833,wikipedia_rel_freq:0.0000238272308420451},枢:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000009149303936108254,news_rel_freq:0.000010854234033179454,twitter_rel_freq:0.000003198430849825076,wikipedia_rel_freq:0.00002603227574183851},碑:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.000039239052974392086,news_rel_freq:0.000040121900801216914,twitter_rel_freq:0.000005197450130965748,wikipedia_rel_freq:0.00005558242658392546},鍛:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00004479468126680602,news_rel_freq:0.000010175844406105739,twitter_rel_freq:0.000045677590574064366,wikipedia_rel_freq:0.000023128754191705913},刀:{jlpt_level:1,joyo_grade:2,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.0003397091873347371,news_rel_freq:0.00003876512154706948,twitter_rel_freq:0.00006876626327123913,wikipedia_rel_freq:0.00009928947551965717},鼓:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00010402234092963843,news_rel_freq:0.000026747933867477943,twitter_rel_freq:0.0000469769531068058,wikipedia_rel_freq:0.000030096950993538615},裸:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00010406119147713783,news_rel_freq:0.000016572089461372202,twitter_rel_freq:0.00006406856796055855,wikipedia_rel_freq:0.00002752354888216122},猶:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0000926002799648154,news_rel_freq:0.00003081827162992024,twitter_rel_freq:0.000002598725065482874,wikipedia_rel_freq:0.000009646115492275452},塊:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.00005033088428547025,news_rel_freq:0.000010272757209973413,twitter_rel_freq:0.0000228887707690607,wikipedia_rel_freq:0.000015663466343098973},旋:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000054954099437898626,news_rel_freq:0.00001308322852213595,twitter_rel_freq:0.000024487986193973237,wikipedia_rel_freq:0.00005965092561290845},弓:{jlpt_level:1,joyo_grade:2,frequency:2000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00008918143178486836,news_rel_freq:0.000010660408425444108,twitter_rel_freq:0.000022788819805003667,wikipedia_rel_freq:0.00005980642588907885},幣:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00005697432790786732,news_rel_freq:0.000020351688812211478,twitter_rel_freq:0.0000022988721733117732,wikipedia_rel_freq:0.00003675542183545814},膜:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0000184540100622141,news_rel_freq:0.000028104713121625374,twitter_rel_freq:0.000013093576291471403,wikipedia_rel_freq:0.00003656295837888658},扇:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.00007422397099760008,news_rel_freq:0.000016862827872975226,twitter_rel_freq:0.00005137479552531528,wikipedia_rel_freq:0.00003116251026303416},腸:{jlpt_level:1,joyo_grade:4,frequency:2000,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.0000369080201244282,news_rel_freq:0.00001860725834259335,twitter_rel_freq:0.00003938067983847124,wikipedia_rel_freq:0.000027102933381044556},槽:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00011383903160930444,aozora_rel_freq:0.000018220906777217714,news_rel_freq:0.000024712764986256795,twitter_rel_freq:0.000012893674363357336,wikipedia_rel_freq:0.000013794913844198891},慈:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0000985832642797227,news_rel_freq:0.000029170753964169787,twitter_rel_freq:0.00001079470411815963,wikipedia_rel_freq:0.0000368166022719842},伐:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000046970311926772314,news_rel_freq:0.000006493157859134138,twitter_rel_freq:0.000008096028088619723,wikipedia_rel_freq:0.00002904541224074696},駿:{jlpt_level:1,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00003422733234696973,news_rel_freq:0.000018413432734858006,twitter_rel_freq:0.00004197940490395412,wikipedia_rel_freq:0.00004969763334557507},漬:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00004127870671811049,news_rel_freq:0.000009206716367429003,twitter_rel_freq:0.00005667219662033806,wikipedia_rel_freq:0.000013269781764016877},糾:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00000944068304235374,news_rel_freq:0.000004554901781780664,twitter_rel_freq:8.995586765133026e-7,wikipedia_rel_freq:0.000007372242601390224},亮:{jlpt_level:1,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00002997319739578564,news_rel_freq:0.0000486502275415722,twitter_rel_freq:0.000028186171864083482,wikipedia_rel_freq:0.00006428534367975749},墳:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00001538481680976165,news_rel_freq:0.00003110901004152326,twitter_rel_freq:0.000004197940490395412,wikipedia_rel_freq:0.00007530292062415878},坪:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00004026859248312614,news_rel_freq:0.00001124188524865015,twitter_rel_freq:0.00001079470411815963,wikipedia_rel_freq:0.00003457204500693438},紺:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.000042055717668098455,news_rel_freq:0.000007365373093943202,twitter_rel_freq:0.000011994115686844035,wikipedia_rel_freq:0.000016268897746221442},娯:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00002540825806460636,news_rel_freq:0.0000070746346823401805,twitter_rel_freq:0.000005497303023136849,wikipedia_rel_freq:0.000010217132899852011},舌:{jlpt_level:1,joyo_grade:5,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00015223587037639148,news_rel_freq:0.0000169597406768429,twitter_rel_freq:0.00005527288312353959,wikipedia_rel_freq:0.000025271344062545638},羅:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00015695621189756835,news_rel_freq:0.000038280557527731114,twitter_rel_freq:0.00010185003237411726,wikipedia_rel_freq:0.00011428887920796286},峡:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.000024106764723376528,news_rel_freq:0.000035179347803965556,twitter_rel_freq:0.000017291516781866816,wikipedia_rel_freq:0.00004777809714956994},俸:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000010237119266091402,news_rel_freq:0.000033144178922744405,twitter_rel_freq:0.000001799117353026605,wikipedia_rel_freq:0.000018445901612607074},峰:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00008257683870997067,news_rel_freq:0.00003789290631226042,twitter_rel_freq:0.00004317881647263852,wikipedia_rel_freq:0.00008564878735920105},醸:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00001192711808231522,news_rel_freq:0.000012114100483459213,twitter_rel_freq:0.000012493870507129202,wikipedia_rel_freq:0.00001623830752795841},蓮:{jlpt_level:1,frequency:2000,aozora_rel_freq:0.0000944651062447865,news_rel_freq:0.00001938256077353474,twitter_rel_freq:0.00006057028421856237,wikipedia_rel_freq:0.00006938753716754537},弔:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000014025047647282718,news_rel_freq:0.000014440007776283382,twitter_rel_freq:7.99607712456269e-7,wikipedia_rel_freq:0.000005549575429884688},乙:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00007428224681884918,news_rel_freq:0.000009497454779032023,twitter_rel_freq:0.00009135518114812873,wikipedia_rel_freq:0.00006720033656173872},汁:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00006874604380018495,news_rel_freq:0.000014149269364680361,twitter_rel_freq:0.00010874664889405258,wikipedia_rel_freq:0.000018953189398802322},尼:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00007787592246254351,news_rel_freq:0.0000224837704973003,twitter_rel_freq:0.00005197450130965748,wikipedia_rel_freq:0.00004540225686447461},遍:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00008457764190618967,news_rel_freq:0.0000061055066436634435,twitter_rel_freq:0.00000719646941210642,wikipedia_rel_freq:0.000016220463233971642},衡:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00002962354246829106,news_rel_freq:0.000011726449267988518,twitter_rel_freq:0.0000021989212092547396,wikipedia_rel_freq:0.000025415373006867404},猟:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000044270734514729504,aozora_rel_freq:0.0000513409985204546,news_rel_freq:0.000011144972444782477,twitter_rel_freq:0.000004297891454452446,wikipedia_rel_freq:0.00002624258349239684},羊:{jlpt_level:1,joyo_grade:3,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00007570029180257722,news_rel_freq:0.000011726449267988518,twitter_rel_freq:0.00002788631897191238,wikipedia_rel_freq:0.00003131291216949406},款:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000004331836046182889,news_rel_freq:0.00000523329140885438,twitter_rel_freq:5.997057843422017e-7,wikipedia_rel_freq:0.0000072524309131933565},閲:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000021464927493417453,news_rel_freq:0.000025681893024933533,twitter_rel_freq:0.000011794213758729968,wikipedia_rel_freq:0.0001783575421750239},偵:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00010734406274083697,news_rel_freq:0.00001589369983429849,twitter_rel_freq:0.000014992644608555042,wikipedia_rel_freq:0.00010828172509656035},喝:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00003166319621200946,news_rel_freq:0.000009594367582899698,twitter_rel_freq:0.000009495341585418194,wikipedia_rel_freq:0.000008189256347498649},敢:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0000822660343299755,news_rel_freq:0.000009012890759693655,twitter_rel_freq:0.00005197450130965748,wikipedia_rel_freq:0.00002246978990662314},胎:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000027991819473316336,news_rel_freq:0.0000061055066436634435,twitter_rel_freq:0.000004397842418509479,wikipedia_rel_freq:0.000016777460124844315},酵:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.000005050571174921754,news_rel_freq:0.00000784993711328157,twitter_rel_freq:0.00000799607712456269,wikipedia_rel_freq:0.00003751890269960626},憤:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00010444969695213182,news_rel_freq:0.000015021484599489425,twitter_rel_freq:0.00000689661651993532,wikipedia_rel_freq:0.00000771638255684931},豚:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.00005489582361664953,news_rel_freq:0.000025972631436536553,twitter_rel_freq:0.00018061139205105976,wikipedia_rel_freq:0.00001898377961706535},遮:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00004219169458434635,news_rel_freq:0.000021223904047020543,twitter_rel_freq:0.000005897106879364984,wikipedia_rel_freq:0.000015541105470046853},扉:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00016365793134121454,news_rel_freq:0.000015796787030430813,twitter_rel_freq:0.000018390977386494186,wikipedia_rel_freq:0.00004356684376869282},硫:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000012237922462310403,news_rel_freq:0.000023065247320506343,twitter_rel_freq:0.0000037981366341672774,wikipedia_rel_freq:0.00003022441023630124},赦:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00003240135661449802,news_rel_freq:0.0000027135585082948636,twitter_rel_freq:0.00001969033991923562,wikipedia_rel_freq:0.000013230269398760463},窃:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00001994975614094093,news_rel_freq:0.000038862034350937156,twitter_rel_freq:0.000003998038562281345,wikipedia_rel_freq:0.0000060402935145207935},泡:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000050595125159690865,aozora_rel_freq:0.00004675663391552562,news_rel_freq:0.000013470879737606646,twitter_rel_freq:0.000031784406570136694,wikipedia_rel_freq:0.000015286186984521602},瑞:{jlpt_level:1,frequency:2000,aozora_rel_freq:0.000026632050310837404,news_rel_freq:0.000023452898535977036,twitter_rel_freq:0.00004457812996943699,wikipedia_rel_freq:0.00005584116884673359},又:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00091269648712961,news_rel_freq:0.000023259072928241688,twitter_rel_freq:0.000058471313973364665,wikipedia_rel_freq:0.00008215130573779463},慨:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00004788329979300817,news_rel_freq:0.00000862523954422296,twitter_rel_freq:0.000005097499166908714,wikipedia_rel_freq:0.000003246386913164056},紡:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00001008171707609381,news_rel_freq:0.000007462285897810875,twitter_rel_freq:0.0000029985289217110087,wikipedia_rel_freq:0.000020848508338682553},恨:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00010318705415840137,news_rel_freq:0.00001046658281770876,twitter_rel_freq:0.00003068494596550932,wikipedia_rel_freq:0.000013898155830836619},肪:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.00001192711808231522,news_rel_freq:0.000011629536464120844,twitter_rel_freq:0.00003158450464202262,wikipedia_rel_freq:0.000013886684498987982},扶:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000033974803788223646,news_rel_freq:0.000007268460290075528,twitter_rel_freq:0.000005097499166908714,wikipedia_rel_freq:0.00001970774811595706},戯:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00018182056229718314,news_rel_freq:0.000004748727389516012,twitter_rel_freq:0.000046477198286520635,wikipedia_rel_freq:0.00005638541981333},忌:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00007437937318759767,news_rel_freq:0.000011726449267988518,twitter_rel_freq:0.000008395880980790824,wikipedia_rel_freq:0.00002247998664604415},濁:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00012235979934935434,news_rel_freq:0.000005524029820457401,twitter_rel_freq:0.000008795684837018959,wikipedia_rel_freq:0.000012598071554657844},奔:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00004496950873055331,news_rel_freq:0.0000037795993508392747,twitter_rel_freq:0.0000034982837419961766,wikipedia_rel_freq:0.000012452768017908451},斗:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.00004294928026058461,news_rel_freq:0.00005213908848080845,twitter_rel_freq:0.00009235469078869906,wikipedia_rel_freq:0.0000671021929448115},迅:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000024592396567119,news_rel_freq:0.000019770211989005436,twitter_rel_freq:0.0000040979895263383785,wikipedia_rel_freq:0.000013793639251771266},肖:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00003364457413447876,news_rel_freq:0.000008237588328752265,twitter_rel_freq:0.0000034982837419961766,wikipedia_rel_freq:0.000027032830797525113},鉢:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00014518449600525073,news_rel_freq:0.000013470879737606646,twitter_rel_freq:0.00001799117353026605,wikipedia_rel_freq:0.000014436033835294896},朽:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000029312738088295872,news_rel_freq:0.00002878310274869909,twitter_rel_freq:0.00000579715591530795,wikipedia_rel_freq:0.000018721213576974343},殻:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.000037665605800666466,news_rel_freq:0.000012501751698929908,twitter_rel_freq:0.000021489457272262228,wikipedia_rel_freq:0.000029570544320928974},享:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000054351915951657954,news_rel_freq:0.0000035857737431039273,twitter_rel_freq:0.000004797646274737614,wikipedia_rel_freq:0.0000558271483300297},藩:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00010909233737830989,news_rel_freq:0.00000784993711328157,twitter_rel_freq:0.000005397352059079815,wikipedia_rel_freq:0.00030692058197997313},沙:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00011051038236203792,news_rel_freq:0.00006405936335653233,twitter_rel_freq:0.00008805679933424662,wikipedia_rel_freq:0.0000988204255062907},輔:{jlpt_level:1,frequency:2000,aozora_rel_freq:0.000030691932524524506,news_rel_freq:0.00004991009399185196,twitter_rel_freq:0.000042479159724239285,wikipedia_rel_freq:0.00010156462300297002},媒:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00003399422906197334,news_rel_freq:0.000008431413936487613,twitter_rel_freq:0.000007596273268334555,wikipedia_rel_freq:0.00003780313681096692},鶏:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.00009712636874849527,news_rel_freq:0.000045258279406203624,twitter_rel_freq:0.00009525326874635304,wikipedia_rel_freq:0.00002178405918056022},禅:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00005468214560540284,news_rel_freq:0.0000065900706630018124,twitter_rel_freq:0.000010994606046273697,wikipedia_rel_freq:0.00003335863301583419},嘱:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000006624018348647378,news_rel_freq:0.000007365373093943202,twitter_rel_freq:8.995586765133026e-7,wikipedia_rel_freq:0.000009885738868669187},胴:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000059810417875323386,news_rel_freq:0.00001201718767959154,twitter_rel_freq:0.0000066967145918212525,wikipedia_rel_freq:0.000024608556000179988},迭:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000002816664693706363,news_rel_freq:0.000004845640193383685,twitter_rel_freq:7.99607712456269e-7,wikipedia_rel_freq:0.0000032489360980193083},挿:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000058470073986594155,news_rel_freq:0.000005911681035928096,twitter_rel_freq:0.000012593821471186236,wikipedia_rel_freq:0.00005989054898930218},嵐:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00005009778100047386,news_rel_freq:0.00004147868005536435,twitter_rel_freq:0.00008195979052676757,wikipedia_rel_freq:0.00007120510596934039},椎:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000026418372299590713,news_rel_freq:0.000010757321229311782,twitter_rel_freq:0.0000228887707690607,wikipedia_rel_freq:0.0000479412449803061},絹:{jlpt_level:1,joyo_grade:6,frequency:2000,aozora_rel_freq:0.00009528096774227386,news_rel_freq:0.000005330204212722054,twitter_rel_freq:0.0000029985289217110087,wikipedia_rel_freq:0.00001999708059702822},陪:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000007051374371140757,news_rel_freq:0.000007462285897810875,twitter_rel_freq:2.9985289217110085e-7,wikipedia_rel_freq:0.0000065450321158607885},剖:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000026146418467094926,news_rel_freq:0.000021999206477961933,twitter_rel_freq:0.000008795684837018959,wikipedia_rel_freq:0.000014469173238413178},譜:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000027797566735819347,news_rel_freq:0.0000070746346823401805,twitter_rel_freq:0.00003808131730572981,wikipedia_rel_freq:0.00006585181777331015},悠:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00005825639597534746,news_rel_freq:0.000023646724143712384,twitter_rel_freq:0.000046877002142748766,wikipedia_rel_freq:0.00004568394179098001},淑:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000017948952944721927,news_rel_freq:0.000005717855428192749,twitter_rel_freq:0.0000029985289217110087,wikipedia_rel_freq:0.000016959726841994867},帆:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00013162565492796078,news_rel_freq:0.000020545514419946826,twitter_rel_freq:0.000023688378481516968,wikipedia_rel_freq:0.00003164175701582163},暁:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00004702858774802141,news_rel_freq:0.000020739340027682174,twitter_rel_freq:0.000012293968579015135,wikipedia_rel_freq:0.00003366708438331974},傑:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00005736283338286131,news_rel_freq:0.000004942552997251359,twitter_rel_freq:0.000009995096405703362,wikipedia_rel_freq:0.000028710194432281257},笛:{jlpt_level:1,joyo_grade:3,frequency:2000,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.00010901463628331108,news_rel_freq:0.000012211013287326887,twitter_rel_freq:0.000029085730540596783,wikipedia_rel_freq:0.000025179573407756546},奴:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0004892837952074197,news_rel_freq:0.000010951146837047129,twitter_rel_freq:0.00039650547441425236,wikipedia_rel_freq:0.00005863125167080745},錠:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00003113871382076758,news_rel_freq:0.000022289944889564954,twitter_rel_freq:0.000011394409902501833,wikipedia_rel_freq:0.000013250662877602484},拳:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.000053730307191667586,news_rel_freq:0.00003556699901943625,twitter_rel_freq:0.00003808131730572981,wikipedia_rel_freq:0.00008161980069547447},翔:{jlpt_level:1,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.000017754700207224935,news_rel_freq:0.00004341693613271782,twitter_rel_freq:0.00014662806427166833,wikipedia_rel_freq:0.00006602261315861207},遷:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000029312738088295872,news_rel_freq:0.000012889402914400603,twitter_rel_freq:0.000002398823137368807,wikipedia_rel_freq:0.00006424455672207345},拙:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00009838901154222571,news_rel_freq:0.00000784993711328157,twitter_rel_freq:0.000004897597238794647,wikipedia_rel_freq:0.000004724914129210505},侍:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00017443895827229752,news_rel_freq:0.000008043762721016918,twitter_rel_freq:0.000014093085932041741,wikipedia_rel_freq:0.00004960076432107548},尺:{jlpt_level:1,joyo_grade:6,frequency:2000,aozora_rel_freq:0.0001638910346262109,news_rel_freq:0.000004264163370177643,twitter_rel_freq:0.000009995096405703362,wikipedia_rel_freq:0.00002649750197792209},峠:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0000718929381476362,news_rel_freq:0.000003876512154706948,twitter_rel_freq:0.00003888092501818608,wikipedia_rel_freq:0.000058781653577267344},篤:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00003216825332950163,news_rel_freq:0.00003227196368793534,twitter_rel_freq:0.000008395880980790824,wikipedia_rel_freq:0.000033549821879978124},渇:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.000031488368748262164,news_rel_freq:0.000003973424958574622,twitter_rel_freq:0.000010994606046273697,wikipedia_rel_freq:0.000006921036882010531},叔:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00021480467712417213,news_rel_freq:0.0000031981225276332325,twitter_rel_freq:0.000009595292549475227,wikipedia_rel_freq:0.000025772258886602754},雌:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.00010751464096434309,aozora_rel_freq:0.000025932740455848236,news_rel_freq:0.000021999206477961933,twitter_rel_freq:0.0000034982837419961766,wikipedia_rel_freq:0.000017310239759592085},堪:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00019635066706195803,news_rel_freq:0.00000784993711328157,twitter_rel_freq:0.00003588239609647507,wikipedia_rel_freq:0.000006216187269533216},叙:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000051593527079200685,news_rel_freq:0.000004651814585648338,twitter_rel_freq:0.00000909553772919006,wikipedia_rel_freq:0.00004417227517181528},酢:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00001377251908853663,news_rel_freq:0.0000017444304696181268,twitter_rel_freq:0.00003808131730572981,wikipedia_rel_freq:0.000012968977951097082},吟:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00005674122462287093,news_rel_freq:0.000004748727389516012,twitter_rel_freq:0.000013693282075813607,wikipedia_rel_freq:0.000011145036187163921},甚:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0002527616620310841,news_rel_freq:0.000011338798052517823,twitter_rel_freq:0.000010095047369760396,wikipedia_rel_freq:0.000017976851599240614},崇:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0000554785818291405,news_rel_freq:0.00003343491733434743,twitter_rel_freq:0.000012094066650901068,wikipedia_rel_freq:0.00005245075298924777},漆:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000022688719739648496,news_rel_freq:0.0000061055066436634435,twitter_rel_freq:0.0000059970578434220174,wikipedia_rel_freq:0.000015468453701672157},岬:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000020804468185927685,news_rel_freq:0.000023937462555315405,twitter_rel_freq:0.000016192056177239445,wikipedia_rel_freq:0.00002882745693562287},癖:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0001414936939928079,news_rel_freq:0.0000061055066436634435,twitter_rel_freq:0.00009385395524955457,wikipedia_rel_freq:0.000025681762824241288},愉:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00013657909973413405,news_rel_freq:0.000002325907292824169,twitter_rel_freq:0.00003208425946230779,wikipedia_rel_freq:0.0000066380773630775045},礁:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.000011305509322324849,news_rel_freq:0.00004341693613271782,twitter_rel_freq:0.000002798626993596941,wikipedia_rel_freq:0.000021044795572536994},乃:{jlpt_level:1,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00012777945072552037,news_rel_freq:0.00003895894715480483,twitter_rel_freq:0.00014652811330761128,wikipedia_rel_freq:0.00009984519781810221},屯:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.000012082520272312812,news_rel_freq:0.000009982018798370392,twitter_rel_freq:0.000009695243513532262,wikipedia_rel_freq:0.000031769216258584256},姻:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00000901332701986036,news_rel_freq:0.000007946849917149244,twitter_rel_freq:0.0000029985289217110087,wikipedia_rel_freq:0.000010199288605865243},擬:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00002426216691337412,news_rel_freq:0.000013180141326003625,twitter_rel_freq:0.00002068984955980596,wikipedia_rel_freq:0.000023681927305295704},塀:{jlpt_level:1,joyo_grade:9,frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00006637616040272167,news_rel_freq:0.000002519732900559516,twitter_rel_freq:0.000001799117353026605,wikipedia_rel_freq:0.00000462804510471091},唇:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0001334322053866828,news_rel_freq:0.00000339194813536858,twitter_rel_freq:0.000025287593906429505,wikipedia_rel_freq:0.000012682194654881177},睦:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00001763814856472674,news_rel_freq:0.000003004296919897885,twitter_rel_freq:0.000006996567483992353,wikipedia_rel_freq:0.00002159796868612679},閑:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00010114740041468298,news_rel_freq:0.000004070337762442295,twitter_rel_freq:0.0000052974010950227815,wikipedia_rel_freq:0.00001345204848116743},胡:{jlpt_level:1,frequency:2000,aozora_rel_freq:0.00008568488250992252,news_rel_freq:0.0000070746346823401805,twitter_rel_freq:0.00002768641704379831,wikipedia_rel_freq:0.000029732417559237508},幽:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.0001334904812079319,news_rel_freq:0.000003973424958574622,twitter_rel_freq:0.000027786368007855348,wikipedia_rel_freq:0.00003590909246351431},曹:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00012094175436562631,news_rel_freq:0.000015312223011092447,twitter_rel_freq:0.00000939539062136116,wikipedia_rel_freq:0.00005812268929218458},詠:{jlpt_level:1,joyo_grade:9,frequency:2000,aozora_rel_freq:0.00004782502397175907,news_rel_freq:0.000010369670013841087,twitter_rel_freq:0.000004797646274737614,wikipedia_rel_freq:0.000019033488721742775},卑:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000129352897899246,news_rel_freq:0.000010854234033179454,twitter_rel_freq:0.000018690830278665287,wikipedia_rel_freq:0.000014754681942201457},侮:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00004819410417300335,news_rel_freq:0.000011823362071856192,twitter_rel_freq:0.000006596763627764219,wikipedia_rel_freq:0.000008663404730575614},鋳:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00001497688606101797,news_rel_freq:0.0000070746346823401805,twitter_rel_freq:0.0000010994606046273698,wikipedia_rel_freq:0.000016183500053570482},抹:{jlpt_level:1,joyo_grade:9,frequency:2500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000017579872743477644,news_rel_freq:0.000014149269364680361,twitter_rel_freq:0.00006386866603244448,wikipedia_rel_freq:0.000016076434289649876},尉:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.0000802846564075062,news_rel_freq:0.00001754121750004894,twitter_rel_freq:0.000002798626993596941,wikipedia_rel_freq:0.00005938453579553456},隷:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000032984114826988997,news_rel_freq:0.000008237588328752265,twitter_rel_freq:0.000010994606046273697,wikipedia_rel_freq:0.00004282120719853146},禍:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00003646123882818512,news_rel_freq:0.000005911681035928096,twitter_rel_freq:0.000002798626993596941,wikipedia_rel_freq:0.000005577616463292465},蝶:{jlpt_level:1,frequency:2500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00007224259307513078,news_rel_freq:0.0000015506048618827794,twitter_rel_freq:0.00005687209854845213,wikipedia_rel_freq:0.00003049972220066851},酪:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.0000023698833974632844,news_rel_freq:0.000005039465801119032,twitter_rel_freq:0.000001599215424912538,wikipedia_rel_freq:0.000005897539162626654},茎:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000024398143829622013,news_rel_freq:0.00000445798897791299,twitter_rel_freq:0.00001519254653666911,wikipedia_rel_freq:0.00002113146785761558},帥:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00001313148505479656,news_rel_freq:0.0000028104713121625373,twitter_rel_freq:0.000006396861699650152,wikipedia_rel_freq:0.00002195357997343451},逝:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00001583159810600473,news_rel_freq:0.000004942552997251359,twitter_rel_freq:0.0000228887707690607,wikipedia_rel_freq:0.00001472664090879368},汽:{jlpt_level:1,joyo_grade:2,frequency:2500,aozora_rel_freq:0.0001893769937858161,news_rel_freq:0.0000051363786049867065,twitter_rel_freq:0.000008096028088619723,wikipedia_rel_freq:0.00002658927263271118},匿:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000018648262799711092,news_rel_freq:0.00001385853095307734,twitter_rel_freq:0.0000022988721733117732,wikipedia_rel_freq:0.00002118627533200351},襟:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00008811304172863491,news_rel_freq:0.000003973424958574622,twitter_rel_freq:0.000010894655082216665,wikipedia_rel_freq:0.000007776288400947744},蛍:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000012024244451063714,news_rel_freq:0.000005911681035928096,twitter_rel_freq:0.00004367857129292369,wikipedia_rel_freq:0.000016279094485642452},寡:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00002362113287963405,news_rel_freq:0.0000021320816850888214,twitter_rel_freq:0.0000013993134967984706,wikipedia_rel_freq:0.000006667392988912908},痢:{jlpt_level:1,joyo_grade:9,frequency:2500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.000008352867712370593,news_rel_freq:0.000004748727389516012,twitter_rel_freq:0.000023388525589345867,wikipedia_rel_freq:0.000003748576329648798},庸:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000047572495413012986,news_rel_freq:0.000008237588328752265,twitter_rel_freq:0.000001299362532741437,wikipedia_rel_freq:0.000012940936917689305},坑:{jlpt_level:1,joyo_grade:9,frequency:2500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00003376112577697696,news_rel_freq:0.000003682686546971601,twitter_rel_freq:0.000001799117353026605,wikipedia_rel_freq:0.000011457311331932352},藍:{jlpt_level:1,joyo_grade:9,frequency:2500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00004230824622684454,news_rel_freq:0.00003934659837027553,twitter_rel_freq:0.000018291026422437153,wikipedia_rel_freq:0.00003555603036106184},賊:{jlpt_level:1,joyo_grade:9,frequency:2500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00009706809292724618,news_rel_freq:0.000007268460290075528,twitter_rel_freq:0.0000228887707690607,wikipedia_rel_freq:0.000050246982681881986},搾:{jlpt_level:1,joyo_grade:9,frequency:2500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00001868711334721049,news_rel_freq:0.000004845640193383685,twitter_rel_freq:0.000008695733872961924,wikipedia_rel_freq:0.000005428489149260194},畔:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000030497679787027514,news_rel_freq:0.000006686983466869486,twitter_rel_freq:0.000005697204951250917,wikipedia_rel_freq:0.00001195057860142371},遼:{jlpt_level:1,frequency:2500,aozora_rel_freq:0.000009498958863602838,news_rel_freq:0.000058632246339942596,twitter_rel_freq:0.000007096518448049387,wikipedia_rel_freq:0.000028414488989071968},唄:{jlpt_level:1,joyo_grade:9,frequency:2500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00011258888665325571,news_rel_freq:0.0000041672505663099695,twitter_rel_freq:0.00002508769197831544,wikipedia_rel_freq:0.00004097559736332865},孔:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00012280658064559743,news_rel_freq:0.0000316904868647293,twitter_rel_freq:0.000006296910735593118,wikipedia_rel_freq:0.000027925045496863487},呂:{jlpt_level:1,joyo_grade:9,frequency:2500,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.00017935355253097138,news_rel_freq:0.00004050955201668761,twitter_rel_freq:0.0004494794853644802,wikipedia_rel_freq:0.00007394165591145395},拷:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000011383210417323645,news_rel_freq:0.000005717855428192749,twitter_rel_freq:0.00000579715591530795,wikipedia_rel_freq:0.000007989145336361328},嬢:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00018302492926966447,news_rel_freq:0.00000261664570442719,twitter_rel_freq:0.000040779993335269715,wikipedia_rel_freq:0.00002396233763937348},渓:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.0000390836507843945,news_rel_freq:0.000010563495621576434,twitter_rel_freq:0.000010294949297874463,wikipedia_rel_freq:0.000045197047483626786},廉:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00003762675525316707,news_rel_freq:0.000004651814585648338,twitter_rel_freq:0.000010594802190045563,wikipedia_rel_freq:0.000021989268561408046},謹:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00003251790825699622,news_rel_freq:0.000007365373093943202,twitter_rel_freq:0.00001239391954307217,wikipedia_rel_freq:0.000007819624543487037},瞳:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000054546168689154946,news_rel_freq:0.0000070746346823401805,twitter_rel_freq:0.00002488779005020137,wikipedia_rel_freq:0.00003668659384436632},湧:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00009271683160731358,news_rel_freq:0.000012695577306665256,twitter_rel_freq:0.00003278391621070703,wikipedia_rel_freq:0.000017869785835320008},褒:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000038287214560656834,news_rel_freq:0.000012501751698929908,twitter_rel_freq:0.00012673782242431862,wikipedia_rel_freq:0.000016950804695001485},醜:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00009294993489230998,news_rel_freq:0.0000011629536464120844,twitter_rel_freq:0.000012194017614958102,wikipedia_rel_freq:0.000006166478164855792},升:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00004046284522062313,news_rel_freq:0.00000678389627073716,twitter_rel_freq:0.000004897597238794647,wikipedia_rel_freq:0.000010112616320786658},殉:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000014549530038524592,news_rel_freq:0.000004070337762442295,twitter_rel_freq:0.0000037981366341672774,wikipedia_rel_freq:0.000011334950458880232},煩:{jlpt_level:1,joyo_grade:9,frequency:2500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00007663270494256277,news_rel_freq:0.000002228994488956495,twitter_rel_freq:0.000009195488693247093,wikipedia_rel_freq:0.0000060097032962577635},劾:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.0000019036768274705073,news_rel_freq:0.000004264163370177643,twitter_rel_freq:2.9985289217110085e-7,wikipedia_rel_freq:0.0000034477725167290032},堕:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00004664008227302743,news_rel_freq:0.0000017444304696181268,twitter_rel_freq:0.00001439293882421284,wikipedia_rel_freq:0.000012554735412118552},租:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000022319639538404213,news_rel_freq:0.0000011629536464120844,twitter_rel_freq:0.0000011994115686844034,wikipedia_rel_freq:0.000009791419029024844},桟:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000028224922758312726,news_rel_freq:0.000006686983466869486,twitter_rel_freq:0.000006097008807479051,wikipedia_rel_freq:0.00000872968353681218},婿:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00003405250488322244,news_rel_freq:0.000001938256077353474,twitter_rel_freq:0.0000022988721733117732,wikipedia_rel_freq:0.000012501202530158249},慕:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00005359433027541969,news_rel_freq:0.000004264163370177643,twitter_rel_freq:0.000004397842418509479,wikipedia_rel_freq:0.00002303825812934445},斐:{jlpt_level:1,frequency:2500,aozora_rel_freq:0.00005456559396290464,news_rel_freq:0.000017638130303916616,twitter_rel_freq:0.000034782935491847697,wikipedia_rel_freq:0.000055966078904640965},罷:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000022611018644649698,news_rel_freq:0.0000024228200966918425,twitter_rel_freq:4.997548202851681e-7,wikipedia_rel_freq:0.000005244947839682014},矯:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000010392521456088993,news_rel_freq:0.000004942552997251359,twitter_rel_freq:0.00001629200714129648,wikipedia_rel_freq:0.000007341652383127194},某:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00008933683397486595,news_rel_freq:3.8765121547069485e-7,twitter_rel_freq:0.00006506807760112889,wikipedia_rel_freq:0.000010385379100298675},囚:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000055362030186642305,news_rel_freq:0.00005524029820457401,twitter_rel_freq:0.000008495831944847857,wikipedia_rel_freq:0.000021541886619311232},虹:{jlpt_level:1,joyo_grade:9,frequency:2500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00002771986564082055,news_rel_freq:0.000008431413936487613,twitter_rel_freq:0.00004117979719149785,wikipedia_rel_freq:0.00003316234578197974},泌:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000007109650192389854,news_rel_freq:0.00000261664570442719,twitter_rel_freq:0.0000024987741014258404,wikipedia_rel_freq:0.00001581769202684175},漸:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00011627968866569854,news_rel_freq:1.9382560773534743e-7,twitter_rel_freq:0.000002598725065482874,wikipedia_rel_freq:0.00000606196158579044},蚊:{jlpt_level:1,joyo_grade:9,frequency:2500,nhk_rel_freq:0.00022135367257364753,aozora_rel_freq:0.00006047087718281316,news_rel_freq:0.000024228200966918426,twitter_rel_freq:0.00007486327207871818,wikipedia_rel_freq:0.000004339987216067377},葵:{jlpt_level:1,frequency:2500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.000022047685705908427,news_rel_freq:0.000009109803563561329,twitter_rel_freq:0.00003878097405412905,wikipedia_rel_freq:0.000025503319884373614},厄:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00005474042142665193,news_rel_freq:0.00000339194813536858,twitter_rel_freq:0.00002768641704379831,wikipedia_rel_freq:0.000007972575634802187},藻:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00004765019650801178,news_rel_freq:0.0000034888609392362536,twitter_rel_freq:0.000006196959771536085,wikipedia_rel_freq:0.000016985218690547392},凸:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000014763208049771281,news_rel_freq:0.0000018413432734858005,twitter_rel_freq:0.000020889751487920028,wikipedia_rel_freq:0.0000076182389399220895},霜:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00006868776797893586,news_rel_freq:0.000008722152348090634,twitter_rel_freq:0.000008895635801075991,wikipedia_rel_freq:0.000010171247572457467},杏:{jlpt_level:1,frequency:2500,aozora_rel_freq:0.00003177974785450765,news_rel_freq:0.000009594367582899698,twitter_rel_freq:0.00004028023851498455,wikipedia_rel_freq:0.00003308969401360505},栓:{jlpt_level:1,joyo_grade:9,frequency:2500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00001252930156855589,news_rel_freq:0.0000041672505663099695,twitter_rel_freq:0.00000689661651993532,wikipedia_rel_freq:0.0000071746807751081554},凹:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000025971591003347636,news_rel_freq:0.0000017444304696181268,twitter_rel_freq:0.000027486515115684246,wikipedia_rel_freq:0.0000061728511269939235},錬:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000016297804675997506,news_rel_freq:0.0000027135585082948636,twitter_rel_freq:0.000010095047369760396,wikipedia_rel_freq:0.00003294439047685566},隼:{jlpt_level:1,frequency:2500,aozora_rel_freq:0.000007770109499879621,news_rel_freq:0.000012889402914400603,twitter_rel_freq:0.00003458303356373363,wikipedia_rel_freq:0.00002730304439218188},憧:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000027234233797078072,news_rel_freq:0.000011338798052517823,twitter_rel_freq:0.0000817598885986535,wikipedia_rel_freq:0.000020680262138235887},妄:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00003867572003565082,news_rel_freq:0.0000032950353315009062,twitter_rel_freq:0.00007296420376163455,wikipedia_rel_freq:0.000016672943545778963},酌:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00005155467653170129,news_rel_freq:0.000004554901781780664,twitter_rel_freq:0.000017291516781866816,wikipedia_rel_freq:0.000002416627242779368},蒼:{jlpt_level:1,frequency:2500,aozora_rel_freq:0.00013857990293035305,news_rel_freq:0.00000862523954422296,twitter_rel_freq:0.0000719646941210642,wikipedia_rel_freq:0.000034773430610499326},梓:{jlpt_level:1,frequency:2500,aozora_rel_freq:0.000010334245634839896,news_rel_freq:0.000002228994488956495,twitter_rel_freq:0.000005197450130965748,wikipedia_rel_freq:0.000013132125781833243},爽:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000036480664101934824,news_rel_freq:0.00000261664570442719,twitter_rel_freq:0.00007406366436626191,wikipedia_rel_freq:0.000007085459305174318},惰:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000022105961527157522,news_rel_freq:9.691280386767371e-8,twitter_rel_freq:0.0000045977443466235465,wikipedia_rel_freq:0.0000017959007305253848},蛮:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000041589511098105676,news_rel_freq:0.000005427117016589727,twitter_rel_freq:0.000018291026422437153,wikipedia_rel_freq:0.000009962214414326762},萌:{jlpt_level:1,frequency:2500,aozora_rel_freq:0.000022105961527157522,news_rel_freq:0.000016572089461372202,twitter_rel_freq:0.0000775619481082581,wikipedia_rel_freq:0.000034653618922302456},瑠:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00005108846996170851,news_rel_freq:0.000014730746187886404,twitter_rel_freq:0.00002208916305660443,wikipedia_rel_freq:0.000024140780579241153},鯉:{jlpt_level:1,frequency:2500,aozora_rel_freq:0.000032731586268242905,news_rel_freq:0.000001259866450279758,twitter_rel_freq:0.000011994115686844035,wikipedia_rel_freq:0.000007490779697159465},弧:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.00003945273098563878,news_rel_freq:0.0000011629536464120844,twitter_rel_freq:0.0000013993134967984706,wikipedia_rel_freq:0.000020172974352040642},遥:{jlpt_level:1,frequency:2500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.000055828236756635084,news_rel_freq:0.000030139882002846522,twitter_rel_freq:0.000027386564151627213,wikipedia_rel_freq:0.000029069629496871858},瑛:{jlpt_level:1,frequency:2500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0000030497679787027516,news_rel_freq:0.000003973424958574622,twitter_rel_freq:0.000006496812663707185,wikipedia_rel_freq:0.000009295602574678233},綺:{jlpt_level:1,frequency:2500,aozora_rel_freq:0.00010612027049460593,news_rel_freq:5.814768232060422e-7,twitter_rel_freq:0.000419194343255199,wikipedia_rel_freq:0.000010252821487825546},芋:{jlpt_level:1,joyo_grade:9,frequency:2500,nhk_rel_freq:0.00003162195322480679,aozora_rel_freq:0.000046912036105523215,news_rel_freq:0.000005717855428192749,twitter_rel_freq:0.000036582052844874306,wikipedia_rel_freq:0.00000898715120719268},茜:{jlpt_level:1,frequency:2500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0000056916052086618225,news_rel_freq:0.00001046658281770876,twitter_rel_freq:0.000013993134967984707,wikipedia_rel_freq:0.00001238903839652714},凌:{jlpt_level:1,frequency:2500,aozora_rel_freq:0.000026185269014594324,news_rel_freq:0.00000445798897791299,twitter_rel_freq:0.000015292497500726144,wikipedia_rel_freq:0.000015900540534637456},婆:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.0002803455507556567,news_rel_freq:0.0000010660408425444107,twitter_rel_freq:0.0000344830825996766,wikipedia_rel_freq:0.000016513619492325682},緋:{jlpt_level:1,frequency:2500,aozora_rel_freq:0.000024786649304615994,news_rel_freq:2.907384116030211e-7,twitter_rel_freq:0.000005397352059079815,wikipedia_rel_freq:0.000010664514841948824},倹:{jlpt_level:1,joyo_grade:9,frequency:2500,aozora_rel_freq:0.000010781026931082975,news_rel_freq:5.814768232060422e-7,twitter_rel_freq:6.996567483992353e-7,wikipedia_rel_freq:0.000002489279011154064},伎:{jlpt_level:1,joyo_grade:9,nhk_rel_freq:0.0001517853754790726,aozora_rel_freq:0.00003793755963316225,news_rel_freq:0.00003072135882605256,twitter_rel_freq:0.00002868592668436865,wikipedia_rel_freq:0.000030559628044766946},且:{jlpt_level:1,joyo_grade:9,aozora_rel_freq:0.00007088282391265185,news_rel_freq:0.0000010660408425444107,twitter_rel_freq:0.00000469769531068058,wikipedia_rel_freq:0.0000071364430022793675},楓:{jlpt_level:1,aozora_rel_freq:0.00001804607931347042,news_rel_freq:0.000002325907292824169,twitter_rel_freq:0.00002868592668436865,wikipedia_rel_freq:0.000020922434699484874},哉:{jlpt_level:1,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.000042172269310596646,news_rel_freq:0.0000372145166851867,twitter_rel_freq:0.000029885338253053052,wikipedia_rel_freq:0.00006606594930115136},颯:{jlpt_level:1,aozora_rel_freq:0.000023543431784635253,news_rel_freq:0.00000261664570442719,twitter_rel_freq:0.00000939539062136116,wikipedia_rel_freq:0.0000029659765790862812},瞭:{jlpt_level:1,joyo_grade:9,aozora_rel_freq:0.00004640697898803104,news_rel_freq:0.000002519732900559516,twitter_rel_freq:0.0000026986760295399076,wikipedia_rel_freq:0.000007882079572440723},栞:{jlpt_level:1,aozora_rel_freq:0.0000049728700799229574,news_rel_freq:0.0000018413432734858005,twitter_rel_freq:0.000007896126160505655,wikipedia_rel_freq:0.000004630594289566162},旦:{jlpt_level:1,joyo_grade:9,aozora_rel_freq:0.00026027924297221763,news_rel_freq:0.000005427117016589727,twitter_rel_freq:0.00012923659652574446,wikipedia_rel_freq:0.000038890364151732106},莉:{jlpt_level:1,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0000027778141462069646,news_rel_freq:0.000018219607127122657,twitter_rel_freq:0.000049075923352003506,wikipedia_rel_freq:0.000023096889381015256},汰:{jlpt_level:1,joyo_grade:9,aozora_rel_freq:0.0000655602989052343,news_rel_freq:0.000008043762721016918,twitter_rel_freq:0.000034383131635619566,wikipedia_rel_freq:0.000010410870948851202},璃:{jlpt_level:1,joyo_grade:9,aozora_rel_freq:0.00005784846522660378,news_rel_freq:0.000007753024309413896,twitter_rel_freq:0.000006596763627764219,wikipedia_rel_freq:0.000016922763661593707},諒:{jlpt_level:1,aozora_rel_freq:0.000012218497188560705,news_rel_freq:0.00001279249011053293,twitter_rel_freq:0.000006097008807479051,wikipedia_rel_freq:0.000020158953835336753},椅:{joyo_grade:9,frequency:2500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00016595011364367902,news_rel_freq:0.000007268460290075528,twitter_rel_freq:0.00003698185670110244,wikipedia_rel_freq:0.000018825730156039695},茨:{joyo_grade:9,frequency:1500,nhk_rel_freq:0.0002529756257984543,aozora_rel_freq:0.000014685506954772485,news_rel_freq:0.0001886892291303607,twitter_rel_freq:0.00028486024756254583,wikipedia_rel_freq:0.00013547260535511112},鬱:{joyo_grade:9,aozora_rel_freq:0.00008887062740487317,news_rel_freq:0.000001259866450279758,twitter_rel_freq:0.00010005091502109066,wikipedia_rel_freq:0.000012594247777374966},岡:{joyo_grade:9,frequency:500,nhk_rel_freq:0.0005502219861116381,aozora_rel_freq:0.00031323253921389726,news_rel_freq:0.0011552006221026705,twitter_rel_freq:0.001938249094993996,wikipedia_rel_freq:0.00130024742400951},俺:{joyo_grade:9,frequency:2000,aozora_rel_freq:0.0004899831050624089,news_rel_freq:0.000013470879737606646,twitter_rel_freq:0.0038512105960815625,wikipedia_rel_freq:0.00004516263348808088},可:{joyo_grade:5,frequency:500,nhk_rel_freq:0.001290175691572117,aozora_rel_freq:0.000759528203613233,news_rel_freq:0.0009649607881104271,twitter_rel_freq:0.0019106626289142547,wikipedia_rel_freq:0.0007564476631324815},牙:{joyo_grade:9,frequency:2500,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.0000369080201244282,news_rel_freq:0.000012986315718268277,twitter_rel_freq:0.000018890732206779353,wikipedia_rel_freq:0.00002942269159932433},崖:{joyo_grade:9,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00008453879135869028,news_rel_freq:0.000007462285897810875,twitter_rel_freq:0.00000799607712456269,wikipedia_rel_freq:0.00001656842696671361},韓:{joyo_grade:9,frequency:500,nhk_rel_freq:0.001094119581578315,aozora_rel_freq:0.000023912511985879535,news_rel_freq:0.0008054423129442361,twitter_rel_freq:0.000243780401335105,wikipedia_rel_freq:0.0002796901893561659},巾:{joyo_grade:9,aozora_rel_freq:0.00007301960402511874,news_rel_freq:0.000006686983466869486,twitter_rel_freq:0.00001049485122598853,wikipedia_rel_freq:0.000008621343180463948},隙:{joyo_grade:9,aozora_rel_freq:0.00009349384255730155,news_rel_freq:0.00001385853095307734,twitter_rel_freq:0.00001969033991923562,wikipedia_rel_freq:0.0000164320455769576},鍵:{joyo_grade:9,frequency:2500,nhk_rel_freq:0.00008221707838449765,aozora_rel_freq:0.00006890144599018254,news_rel_freq:0.000026844846671345615,twitter_rel_freq:0.00012044091168872551,wikipedia_rel_freq:0.000033379026494676204},孝:{joyo_grade:6,frequency:1500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00009877751701721969,news_rel_freq:0.00006716057308029788,twitter_rel_freq:0.000046877002142748766,wikipedia_rel_freq:0.0001555448869053693},傲:{joyo_grade:9,aozora_rel_freq:0.000025194580053359674,news_rel_freq:0.000002228994488956495,twitter_rel_freq:0.000003998038562281345,wikipedia_rel_freq:0.000004496762084665406},頃:{joyo_grade:9,frequency:2500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.0009280230281181226,news_rel_freq:0.00007830554552508035,twitter_rel_freq:0.0004966563403994,wikipedia_rel_freq:0.00028693879649207643},埼:{joyo_grade:9,frequency:1000,nhk_rel_freq:0.00027827318837829977,aozora_rel_freq:0.000006876546907393465,news_rel_freq:0.000188010839503287,twitter_rel_freq:0.0005303398152866203,wikipedia_rel_freq:0.00020076360246026572},斬:{joyo_grade:9,frequency:2500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00015089552648766226,news_rel_freq:0.000006396245055266465,twitter_rel_freq:0.000019390487027064523,wikipedia_rel_freq:0.00004741101453041358},寿:{joyo_grade:9,frequency:1500,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.00009976820597845434,news_rel_freq:0.00007462285897810875,twitter_rel_freq:0.0003059499009785799,wikipedia_rel_freq:0.00013663375905667864},呪:{joyo_grade:9,frequency:2500,aozora_rel_freq:0.00007894431251877695,news_rel_freq:0.0000027135585082948636,twitter_rel_freq:0.00007306415472569157,wikipedia_rel_freq:0.00004314750286000378},粧:{joyo_grade:9,frequency:2000,nhk_rel_freq:0.00006324390644961357,aozora_rel_freq:0.00005442961704665675,news_rel_freq:0.000025197329005595164,twitter_rel_freq:0.00008715724065773332,wikipedia_rel_freq:0.000022194477942255872},丈:{joyo_grade:9,frequency:1500,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.0002954778390066723,news_rel_freq:0.00004157559285923202,twitter_rel_freq:0.0008936615696339376,wikipedia_rel_freq:0.00005048915524313097},尻:{joyo_grade:9,frequency:2000,aozora_rel_freq:0.00012381669488058177,news_rel_freq:0.000028298538729360722,twitter_rel_freq:0.00011094557010330731,wikipedia_rel_freq:0.00006408013429890966},芯:{joyo_grade:9,frequency:2500,aozora_rel_freq:0.000007925511689877215,news_rel_freq:0.0000041672505663099695,twitter_rel_freq:0.000011894164722787,wikipedia_rel_freq:0.000005742038886456251},身:{joyo_grade:3,frequency:500,nhk_rel_freq:0.00012648781289922715,aozora_rel_freq:0.0022332848724554008,news_rel_freq:0.000775496256549125,twitter_rel_freq:0.0007852147736320561,wikipedia_rel_freq:0.0016048240305150784},脊:{joyo_grade:9,frequency:2500,aozora_rel_freq:0.00002979836993203835,news_rel_freq:0.00000862523954422296,twitter_rel_freq:0.0000022988721733117732,wikipedia_rel_freq:0.000019563719171635295},狙:{joyo_grade:9,frequency:1000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00004450330216056053,news_rel_freq:0.0004004437055812278,twitter_rel_freq:0.0001141440009531324,wikipedia_rel_freq:0.00006329753454834714},遜:{joyo_grade:9,aozora_rel_freq:0.00002606871737209613,news_rel_freq:0.0000027135585082948636,twitter_rel_freq:0.0000019990192811406725,wikipedia_rel_freq:0.00000422017552787051},戴:{joyo_grade:9,frequency:2500,aozora_rel_freq:0.00008681154838740507,news_rel_freq:0.0000034888609392362536,twitter_rel_freq:0.000020290045703577825,wikipedia_rel_freq:0.000015091174343094787},誰:{joyo_grade:9,frequency:2000,nhk_rel_freq:0.0002909219696682225,aozora_rel_freq:0.0009036248842885006,news_rel_freq:0.00006279949690625256,twitter_rel_freq:0.0017760286803294304,wikipedia_rel_freq:0.0000898077824505455},酎:{joyo_grade:9,aozora_rel_freq:0.000009576659958601634,news_rel_freq:0.00000891597795582598,twitter_rel_freq:0.000027986269935969413,wikipedia_rel_freq:0.000006190695420980691},貼:{joyo_grade:9,frequency:2500,nhk_rel_freq:0.0001517853754790726,aozora_rel_freq:0.00004021031666187704,news_rel_freq:0.000023743636947580057,twitter_rel_freq:0.0001379323303987064,wikipedia_rel_freq:0.00005455637967968633},爪:{joyo_grade:9,frequency:2500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00007727373897630284,news_rel_freq:0.000007462285897810875,twitter_rel_freq:0.00005297401095022782,wikipedia_rel_freq:0.00002168209178635012},的:{joyo_grade:4,frequency:500,nhk_rel_freq:0.00018340732870387937,aozora_rel_freq:0.003608128047364101,news_rel_freq:0.002099518982989283,twitter_rel_freq:0.0012697770473805551,wikipedia_rel_freq:0.0023141844255937633},賭:{joyo_grade:9,frequency:2000,nhk_rel_freq:0.000018973171934884074,aozora_rel_freq:0.000045688243859292175,news_rel_freq:0.000009012890759693655,twitter_rel_freq:0.00001549239942884021,wikipedia_rel_freq:0.00002348946384872414},唐:{joyo_grade:9,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00014440748505526276,news_rel_freq:0.000028589277140963743,twitter_rel_freq:0.00010214988526628836,wikipedia_rel_freq:0.00009030614808974736},栃:{joyo_grade:9,frequency:1500,nhk_rel_freq:0.00009486585967442038,aozora_rel_freq:0.00000780896004737902,news_rel_freq:0.0001617474696551474,twitter_rel_freq:0.00012293968579015136,wikipedia_rel_freq:0.00010614678278028639},丼:{joyo_grade:9,frequency:2500,nhk_rel_freq:0.00003794634386976815,aozora_rel_freq:0.000007789534773629321,news_rel_freq:0.000012986315718268277,twitter_rel_freq:0.00021029682837599874,wikipedia_rel_freq:0.000008607322663760059},謎:{joyo_grade:9,frequency:2500,aozora_rel_freq:0.00004561054276429338,news_rel_freq:0.000011920274875723866,twitter_rel_freq:0.00015022629897772154,wikipedia_rel_freq:0.0000623046270472263},鍋:{joyo_grade:9,frequency:2000,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.0000595967398640767,news_rel_freq:0.000019479473577402416,twitter_rel_freq:0.0000707652825523798,wikipedia_rel_freq:0.000036724831617195107},箸:{joyo_grade:9,frequency:2500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00004619330097678435,news_rel_freq:0.0000035857737431039273,twitter_rel_freq:0.000018291026422437153,wikipedia_rel_freq:0.000005206710066853227},畑:{joyo_grade:3,frequency:1500,nhk_rel_freq:0.00017075854741395666,aozora_rel_freq:0.00015526621308134455,news_rel_freq:0.00010088622882624832,twitter_rel_freq:0.00008515822137659265,wikipedia_rel_freq:0.00009785173526129476},阪:{joyo_grade:9,frequency:1000,nhk_rel_freq:0.0005944927206263677,aozora_rel_freq:0.0001457672542177417,news_rel_freq:0.0013971918933602518,twitter_rel_freq:0.00230706815236445,wikipedia_rel_freq:0.0009202926959265529},阜:{joyo_grade:9,frequency:2000,nhk_rel_freq:0.0001328122035441885,aozora_rel_freq:0.000009071602841109458,news_rel_freq:0.00015234692767998308,twitter_rel_freq:0.00019820276172509765,wikipedia_rel_freq:0.00015122784235299918},分:{joyo_grade:2,frequency:500,nhk_rel_freq:0.0031748441037706015,aozora_rel_freq:0.005874727264300236,news_rel_freq:0.005441363198758276,twitter_rel_freq:0.005464818959818313,wikipedia_rel_freq:0.003137051100129849},蔑:{joyo_grade:9,frequency:2500,aozora_rel_freq:0.00007645787747881548,news_rel_freq:0.0000028104713121625373,twitter_rel_freq:0.00000579715591530795,wikipedia_rel_freq:0.000009430709372006615},哺:{joyo_grade:9,frequency:2500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.000002583561408709974,news_rel_freq:0.000002907384116030211,twitter_rel_freq:0.0000022988721733117732,wikipedia_rel_freq:0.00001644224231637861},蜂:{joyo_grade:9,frequency:2500,nhk_rel_freq:0.000025297562579845433,aozora_rel_freq:0.00006526891979898882,news_rel_freq:0.000003101209723765559,twitter_rel_freq:0.000017591369674037917,wikipedia_rel_freq:0.000029169047706226706},坊:{joyo_grade:9,frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.00031078495472143514,news_rel_freq:0.00003265961490340604,twitter_rel_freq:0.00025957265365611634,wikipedia_rel_freq:0.00007549920785801323},枕:{joyo_grade:9,frequency:2500,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.0001438830026640209,news_rel_freq:0.000011435710856385497,twitter_rel_freq:0.00003878097405412905,wikipedia_rel_freq:0.000016182225461142857},蜜:{joyo_grade:9,frequency:2500,aozora_rel_freq:0.000039646983723135766,news_rel_freq:0.0000034888609392362536,twitter_rel_freq:0.000015692301356954278,wikipedia_rel_freq:0.000014427111688301512},無:{joyo_grade:4,frequency:500,nhk_rel_freq:0.0004110853919224883,aozora_rel_freq:0.002470059534190483,news_rel_freq:0.0011144972444782476,twitter_rel_freq:0.003055600922187575,wikipedia_rel_freq:0.0010056151876242816},闇:{joyo_grade:9,frequency:2000,aozora_rel_freq:0.0001910087167807908,news_rel_freq:0.000016378263853636857,twitter_rel_freq:0.00018710820471476693,wikipedia_rel_freq:0.00005130234521195652},里:{joyo_grade:2,frequency:1500,nhk_rel_freq:0.0001201634222542658,aozora_rel_freq:0.0004234515424696897,news_rel_freq:0.00031234996686551236,twitter_rel_freq:0.00029505524589636323,wikipedia_rel_freq:0.000409003964100987},賂:{joyo_grade:9,aozora_rel_freq:0.000005633329387412726,news_rel_freq:0.000014730746187886404,twitter_rel_freq:0.000004197940490395412,wikipedia_rel_freq:0.0000026078161069233053},脇:{joyo_grade:9,frequency:2000,aozora_rel_freq:0.0000780507499262908,news_rel_freq:0.00010582878182349969,twitter_rel_freq:0.00006686719495415549,wikipedia_rel_freq:0.00007251538698494018},笠:{frequency:1500,nhk_rel_freq:0.00010119025031938173,aozora_rel_freq:0.00009901062030221608,news_rel_freq:0.0000995294495721009,twitter_rel_freq:0.00005187455034560045,wikipedia_rel_freq:0.00011121456227252835},菅:{frequency:2000,nhk_rel_freq:0.00005691951580465222,aozora_rel_freq:0.000039355604616890285,news_rel_freq:0.0001592277367545879,twitter_rel_freq:0.0000344830825996766,wikipedia_rel_freq:0.00007482877224108183},柴:{frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00006491926487149424,news_rel_freq:0.00003081827162992024,twitter_rel_freq:0.000049475727208231644,wikipedia_rel_freq:0.00007292580574663583},龍:{frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00015077897484516405,news_rel_freq:0.00010989911958594198,twitter_rel_freq:0.00014912683837309417,wikipedia_rel_freq:0.00022526636728895273},吾:{frequency:2000,nhk_rel_freq:0.000012648781289922716,aozora_rel_freq:0.00041842039656851763,news_rel_freq:0.00005339895493108821,twitter_rel_freq:0.000044278277077265894,wikipedia_rel_freq:0.00010079731836153901},呆:{frequency:2000,aozora_rel_freq:0.00010446912222588151,news_rel_freq:2.907384116030211e-7,twitter_rel_freq:0.000029885338253053052,wikipedia_rel_freq:0.000006881524516754118},堰:{frequency:2000,aozora_rel_freq:0.000009751487422348924,news_rel_freq:0.000004264163370177643,twitter_rel_freq:7.99607712456269e-7,wikipedia_rel_freq:0.000012116275617015122},淀:{frequency:2000,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000024495270198370505,news_rel_freq:0.0000169597406768429,twitter_rel_freq:0.000035182739348075834,wikipedia_rel_freq:0.000031723330931189706},烏:{frequency:2500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.0000759139698138239,news_rel_freq:0.0000061055066436634435,twitter_rel_freq:0.0000335835239231633,wikipedia_rel_freq:0.000034629401666177556},狐:{frequency:2500,aozora_rel_freq:0.00009827245989972751,news_rel_freq:0.00000261664570442719,twitter_rel_freq:0.000029485534396824918,wikipedia_rel_freq:0.000014555845523491762},叱:{frequency:2500,aozora_rel_freq:0.00012008704232063955,news_rel_freq:0.000004942552997251359,twitter_rel_freq:0.00001439293882421284,wikipedia_rel_freq:0.00000874625323837132},蒙:{frequency:2500,aozora_rel_freq:0.0000800709783962595,news_rel_freq:0.0000014536920580151055,twitter_rel_freq:0.00000939539062136116,wikipedia_rel_freq:0.000018521102565837023},贅:{frequency:2500,aozora_rel_freq:0.00003416905652572064,news_rel_freq:6.783896270737159e-7,twitter_rel_freq:0.000043478669364809626,wikipedia_rel_freq:0.00000398565052118728},蟹:{frequency:2500,aozora_rel_freq:0.000035489975140700174,news_rel_freq:0.000003004296919897885,twitter_rel_freq:0.00001659186003346758,wikipedia_rel_freq:0.0000104350882049761},瓜:{frequency:2500,aozora_rel_freq:0.00006713374607895993,news_rel_freq:0.000004651814585648338,twitter_rel_freq:0.000010694753154102597,wikipedia_rel_freq:0.000011194745291841344},醤:{frequency:2500,nhk_rel_freq:0.000006324390644961358,aozora_rel_freq:0.000019852629772192433,news_rel_freq:5.814768232060422e-7,twitter_rel_freq:0.00005607249083599586,wikipedia_rel_freq:0.000010641572178251551},噌:{aozora_rel_freq:0.00003820951346565804,news_rel_freq:0.0000017444304696181268,twitter_rel_freq:0.00009405385717766864,wikipedia_rel_freq:0.000009467672552407777},墟:{aozora_rel_freq:0.000012043669724813413,news_rel_freq:3.8765121547069485e-7,twitter_rel_freq:0.00000469769531068058,wikipedia_rel_freq:0.000006251875857506751},鰐:{aozora_rel_freq:0.000009129878662358555,news_rel_freq:0.0000016475176657504531,twitter_rel_freq:0.000001799117353026605,wikipedia_rel_freq:0.000005354562788457872},凛:{aozora_rel_freq:0.0000069542480023922615,news_rel_freq:0.0000021320816850888214,twitter_rel_freq:0.00004317881647263852,wikipedia_rel_freq:0.000012371194102540372},漣:{aozora_rel_freq:0.00000512827226992055,news_rel_freq:0.000002228994488956495,twitter_rel_freq:0.000002898577957653975,wikipedia_rel_freq:0.00000391427334524021}};

    function isKanji(characters) {
        var c = characters.charCodeAt(0);
        return (c >= 0x4e00 && c <= 0x9faf) || (c >= 0x3400 && c <= 0x4dbf);
    }

    // Jlpt
    function jlptDataKanji(characters) {
        var jlpt_level = jlptJoyoFreqdata[characters];
        if (!jlpt_level) return 'None';
        jlpt_level = jlpt_level.jlpt_level;
        return (jlpt_level ? 'N'+jlpt_level : 'None');
    }

    function makeJlptData(item) {
        if (item.object === 'radical') return '';
        var characters = item.data.characters;
        if (item.object === 'kanji') return jlptDataKanji(characters);
        let result = [];
        for (var idx in characters) {
            let char = characters.charAt(idx);
            if (isKanji(char)) result.push(char+': '+jlptDataKanji(char));
        };
        return (result === '' ? 'None' : result.join(', '))
    }

    function jlptSortDataKanji(characters) {
        var jlpt_level = jlptJoyoFreqdata[characters];
        if (!jlpt_level) return -infinity + 1;
        jlpt_level = jlpt_level.jlpt_level;
        return (jlpt_level ? jlpt_level : -infinity + 1);
    }

    function makeJlptSortData(item) {
        if (item.object === 'radical') return -infinity;
        var characters = item.data.characters;
        if (item.object === 'kanji') return jlptSortDataKanji(characters) * 0x10000;
        let result = -infinity + 1;
        for (var idx in characters) {
            let char = characters.charAt(idx);
            if (isKanji(char)) result = Math.max(result, jlptSortDataKanji(char) * 0x10000 - characters.charCodeAt(idx));
        };
        return result
    }

    // Joyo
    function joyoDataKanji(characters) {
        var joyo_grade = jlptJoyoFreqdata[characters];
        if (!joyo_grade) return 'None';
        joyo_grade = joyo_grade.joyo_grade;
        return (joyo_grade ? joyo_grade : 'None');
    }

    function makeJoyoData(item) {
        if (item.object === 'radical') return '';
        var characters = item.data.characters;
        if (item.object === 'kanji') return joyoDataKanji(characters);
        let result = [];
        for (var idx in characters) {
            let char = characters.charAt(idx);
            if (isKanji(char)) result.push(char+': '+joyoDataKanji(char));
        };
        return (result === '' ? 'None' : result.join(', '))
    }

    function joyoSortDataKanji(characters) {
        var joyo_grade = jlptJoyoFreqdata[characters];
        if (!joyo_grade) return 10;
        joyo_grade = joyo_grade.joyo_grade;
        return (joyo_grade ? joyo_grade : 10);
    }

    function makeJoyoSortData(item) {
        if (item.object === 'radical') return infinity;
        var characters = item.data.characters;
        if (item.object === 'kanji') return joyoSortDataKanji(characters) * 0x10000;
        let result = infinity - 1;
        for (var idx in characters) {
            let char = characters.charAt(idx);
            if (isKanji(char)) result = Math.min(result, joyoSortDataKanji(char) * 0x10000 + characters.charCodeAt(idx));
        };
        return result
    }

    // Frequency
    function frequencyDataKanji(characters) {
        var frequency = jlptJoyoFreqdata[characters];
        if (!frequency) return 'None';
        frequency = frequency.frequency;
        return (frequency ? frequency : 'None');
    }

    function makeFrequencyData(item) {
        if (item.object === 'radical') return '';
        var characters = item.data.characters;
        if (item.object === 'kanji') return frequencyDataKanji(characters);
        let result = [];
        for (var idx in characters) {
            let char = characters.charAt(idx);
            if (isKanji(char)) result.push(char+': '+frequencyDataKanji(char));
        };
        return (result === '' ? 'None' : result.join(', '))
    }

    function frequencySortDataKanji(characters) {
        var frequency = jlptJoyoFreqdata[characters];
        if (!frequency) return 3000;
        frequency = frequency.frequency;
        return (frequency ? frequency : 3000);
    }

    function makeFrequencySortData(item) {
        if (item.object === 'radical') return infinity;
        var characters = item.data.characters;
        if (item.object === 'kanji') return frequencySortDataKanji(characters) * 0x8000;
        let result = infinity - 1;
        for (var idx in characters) {
            let char = characters.charAt(idx);
            if (isKanji(char)) result = Math.min(result, frequencySortDataKanji(char) * 0x8000 + characters.charCodeAt(idx));
        };
        return result
    }

    // END Support of JLPT, Joyo and Frequency

    //=================================================
    // End of the helper functions registered in metadata
    //-------------------------------------------------

    //=================================================
    // Other external information not registered in metadata
    //-------------------------------------------------

    // BEGIN Pitch Info

    // Source the pitch info script
    // https://community.wanikani.com/t/userscript-wanikani-pitch-info/18745

    // Table of Kanji : Patterns
    var pitchInfoTable = {胃痛:[0], 二:[1], 微生物:[2], 名人:[3], 中毒:[1], 六:[2], 予想:[0], 猫舌:[0, 2], 汁:[1], 僕:[1], 順位:[1], 貴重品:[0], 前回:[1, 0], 十:[1], 石:[2], 言い方:[0], 変死:[0], 細かい:[3], 妙:[1], 五月:[1], 薄弱:[0], 刀:[3, 2], 天才:[0], 林:[3, 0], 矢:[1], 文章:[1], 空港:[0], 一億:[2], 易しい:[0, 3], 並:[0], 貧しい:[3], 童話:[0], 仕草:[1, 0], 王:[1], 演ずる:[0, 3], 立つ:[1], 白:[1], 共同:[0], 愛国心:[4], 半分:[3], 独占:[0], 友人:[0], 方:[1], 崩れる:[3], 池:[2], 気:[0], 今回:[1], 春休み:[3], 褒賞:[0], 崎:[0], 訪れる:[4], 井戸:[1], 価値:[1], 耳:[2], 赤:[1], 肉:[2], 斗:[1], 色:[2], 電鉄:[0], 雨:[1], 無理:[1], 企てる:[4], 非難する:[1], 草:[2], 削除する:[1], 両日:[1], お願い:[0], 禅僧:[0], 土地:[0], 裏切り:[0], 犯す:[2, 0], 沿岸:[0], 隔週:[0], 死亡:[0], 首:[0], 姉妹:[1], 死ぬ:[0], 羊毛:[0], 午後:[1], 訪問:[0], 象牙:[0, 3], 認める:[0], 潜水艦:[0], 科学:[1], お茶:[0], 線路:[1], 左腕:[1, 0], 練習する:[0], 寺:[2, 0], 恐い:[2], 雪:[2], 今週:[0], 尊敬:[0], 豆:[2], 抱く:[2], 隣:[0], 在留:[0], 材木:[0], 暗記する:[0], 電気:[1], 迷信:[0, 3], 名所:[0, 3], 何人:[1], 並行:[0], 住人:[0], 測る:[2], 近隣:[0], 全然:[0], 販売:[0], 固める:[0], 絵:[1], 予定:[0], 扱い:[0], 牛乳:[0], 途中:[0], 逃れる:[3], 泳ぐ:[2], 悲劇:[1], 人気:[0], 粘り:[3], 速度:[1], 起きる:[2], 間抜け:[0], 鈍い:[2], 隣国:[0, 1], 勝者:[1], 野郎:[2, 0], 動く:[2], 講演:[0], 刑期:[1], 頭:[3, 2], 農民:[0], 夕焼け:[0], 顔面:[0, 3], 飲む:[1], 牛丼:[0], 絶つ:[1], 爆弾:[0], 共通点:[3], 海岸:[0], 高級:[0], 約:[1], 座る:[0], 同じ:[0], 癒着:[0], 雅致:[1], 阻害:[0], 孤児:[1], 鏡:[3], 話題:[0], 公告:[0], 大敵:[0], 登山:[1, 0], 補充:[0], 汁物:[0, 3], 雇用者:[2], 可能性:[0], 作戦:[0], 洋服:[0], 坂:[2, 1], 劇的:[0], 二日酔い:[0], 歯:[1], 用:[1], 奥様:[1], 勇気:[1], 気泡:[0], 社員:[1], 二階:[0], 箱:[0], 暴れる:[0], 玉:[2], 清い:[2], 記録:[0], 懇談:[0], 仏典:[0], 火:[1], 左手:[0], 荒波:[0], 並ぶ:[0], 暖かい:[4], 辺:[0], 窒素:[1], 片手:[0], 追い付く:[3], 愛:[1], 庄園:[0], 研修:[0], 国益:[0], 左:[0], 一千:[3], 千:[1], 残業:[0], 変:[1], 証明:[0], 傘立て:[2], 王子:[1], 死刑:[2], 銀色:[0], 私生活:[2], 署名:[0], 月額:[0], 取り扱う:[0, 5], 仏壇:[0], 官僚的:[0], 追う:[0], 遅延:[0], お笑い:[0], 続く:[0], 土俵:[0], 踊る:[0], 作家:[0], 短い:[3], 陣営:[0], 私立:[1], 会議:[1, 3], 残額:[0], 措辞:[0, 1], 近々:[2, 0], 砕く:[2], 市:[1], 冬:[2], 不可能:[2], 眠い:[0, 2], 老齢:[0], 抽出:[0], 旅券:[0], 抗戦:[0], 外:[1], 鳥:[0], 蔵:[2], 独裁:[0], 落書き:[0], 借り手:[0], 睡眠:[0], 幽霊:[1], 創造的:[0], 寂しい:[3], 黒人:[0], 拡大:[0], 二枚舌:[2], 約束:[0], 皇室:[0], 爆撃:[0], 瞳孔:[0], 児童:[1], 赤い:[0], 官僚:[0], 小包:[2], 足首:[2, 3], 眼孔:[0], 涙:[1], 失望:[0], 岩:[2], 枠:[2], 瞬き:[2], 博物館:[4], 遅れる:[0], 早い:[2], 小学生:[3, 4], 魅力:[0], 元気:[1], 絡む:[2], 花:[2], 竜巻:[0], 経験者:[3], 降る:[1], 両手:[0], 閉じる:[2], 滞る:[0, 4], 折り目:[3, 0], 縁談:[0], 血:[0], 魚:[0], 月見:[3, 0], 蒸気:[1], 服装:[0], 年:[2], 一流:[0], 殺人:[0], 培養:[0], 和風:[0], 博覧会:[3], 変装:[0], 北西:[0], 見せる:[2], 町:[2], 糸:[1], 博打:[0], 取り逃がす:[4, 0], 破船:[0], 長寿:[1], 春:[1], 報道:[0], 達人:[0], 肩:[1], 入獄:[0], 化粧:[2], 変える:[0], 便秘:[0], 谷:[2], 嘆息:[0], 限界:[0], 欺く:[3], 遠い:[0], 外面:[0, 3], 祈念:[0, 1], 兼業:[0], 学校:[0], 毛糸:[0], 通勤:[0], 声:[1], 炭:[2], 期限:[1], 風:[0], 何:[1], 昨日:[2], 三つ編み:[0], 白い:[2], 作文:[0], 蒸し返す:[3, 0], 来年:[0], 限る:[2], 日記:[0], 巨大:[0], 地球:[0], 流す:[2], 微妙:[0], 工学:[0, 1], 毎日:[1], 故に:[2], 葬式:[0], 零下:[1], 老眼:[0], 妙薬:[1, 0], 請ける:[2], 一回:[3, 0], 夕刊:[0], 麦:[1], 近日:[1, 0], 尽くす:[2], 泣き虫:[3, 4], 切り取る:[3, 0], 売る:[0], 本州:[1], 運:[1], 手作り:[2], 悪気:[0, 3], 禅宗:[0], 征服:[0], 隔月:[0], 溶ける:[2], 地図:[1], 必死:[0], 携帯:[0], 黒煙:[0], 雑誌:[0], 聖書:[1], 埋め合わせる:[5, 0], 会社員:[3], 自由:[2], 権利:[1], 特質:[0], 鉄鉱:[0], 右翼:[1], 布地:[0], 入学:[0], 金魚:[1], 暴力:[1], 紹介:[0], 不完全:[2], 質:[0, 2], 避難:[1], 思い遣り:[0], 海亀:[0], 体育:[1], 未来:[1], 待つ:[1], 親しい:[3], 処分:[1], 晩:[0], 果糖:[0, 2], 地理:[1], 皮膚科:[0], 需要:[0], 吉:[2, 1], 以前:[1], 心理学:[3], 折り紙:[0, 2], 平仮名:[3], 取材:[0], 筋肉:[1], 陰謀:[0], 懲罰:[1, 0], 回想:[0], 計画:[0], 泣き声:[3, 0], 靴:[2], 皮膚病:[0], 園:[1], 時限:[0, 1], 高校:[0], 限定:[0], 何時:[1], 見当たる:[0], 互い:[0], 全額:[0], 振り仮名:[0, 3], 相互:[1], 風船:[0], 選ぶ:[2], 兼用:[0], 来週:[0], 失礼:[2], 年末:[0], 保証:[0], 桃:[0], 白鳥:[0], 住所:[1], 剣道:[1], 踊り場:[0], 阪神:[1], 嫌疑:[1], 穴場:[0], 飛行機:[2], 海:[1], 黒い:[2], 寿司:[2, 1], 助言:[0], 南東:[0], 若者:[0], 傾向:[0], 高い:[2], 仕返し:[0], 攻める:[2], 帆船:[0], 星:[0], 四日:[0], 橋:[2], 有毒:[0], 保険:[0], 専攻:[0], 震える:[0], 強い:[2], 喜寿:[1], 国民:[0], 倒産:[0], 議論:[1], 足す:[0], 彼氏:[1], 生き甲斐:[0, 3], 着ける:[2], 毒:[2], 外交官:[3], 留守番電話:[5], 愛憎:[0], 時:[2], 黄色:[0], 当て字:[0], 抑止:[1, 0], 乗る:[0], 帯:[1], 苦しむ:[3], 嫌:[2], 端:[0], 幾つ:[1], 緩やか:[2], 貯蓄:[0], 料理:[1], 私立大学:[4], 画面:[1, 0], 立入禁止:[0], 表彰:[0], 見返る:[0], 行く:[0], 入場:[0], 墜落:[0], 大役:[0], 買う:[0], 水兵:[1], 高値:[2], 小文字:[0], 独り言:[0, 4], 盾:[1], 反響:[0], 青空:[3], 売れる:[0], 木製:[0], 全米:[0], 衰退:[0], 場所:[0], 学者:[0], 形:[0], 事変:[1], 罪:[1], 制服:[0], 評価:[1], 数学:[0], 兵舎:[1], 拘置:[1, 0], 交番:[0], 森:[0], 私鉄:[0], 総理:[1], 感触:[0], 学ぶ:[0, 2], 欠ける:[0], 操作:[1], 抑圧:[0], 侵食:[0], 冬休み:[3], 妻子:[1], 弓矢:[2], 先輩:[0], 失う:[0], 馬力:[0], 医学:[1], 巨人:[0], 内緒:[3, 0], 走り回る:[5], 美人:[1, 0], 魔法:[0], 二番:[1], 曲線:[0], 心底:[1, 0], 遅滞:[0], 防ぐ:[2], 描写:[0], 開拓:[0], 為に:[2], 読者:[1], 考える:[4, 3], 道路:[1], 公開:[0], 得:[0], 戸:[0], 予約:[0], 浅い:[0, 2], 布:[0], 人権:[0], 緩む:[2], 天国:[1], 熱烈:[0], 伸びる:[2], 善悪:[1], 季節:[2, 1], 毛布:[1], 瞬時:[1], 自己:[1], 涼風:[0, 3], 教える:[0], 決まる:[0], 扱う:[0, 3], 賄賂:[1], 頑固:[1], 入団:[0], 容疑:[1], 邸内:[1], 大学生:[3, 4], 転がる:[0], 対する:[3], 大臣:[1], 裏:[2], 才能:[0], 英文:[0], 事件:[1], 大学:[0], 豪華:[1], 有意:[1], 塀:[0], 返還:[0], 芸者:[0], 秋:[1], 軍人:[0], 覚える:[3], 過程:[0], 弱い:[2], 歯医者:[1], 虫歯:[0], 音読み:[0], 運転手:[3], 歴史:[0], 割合:[0], 地獄:[0, 3], 変人:[0], 読む:[1], 大違い:[3], 初回:[0], 特別:[0], 不信:[0], 計算:[0], 派手:[2], 精度:[1], 月:[2], 壇:[1], 属する:[3], 抽象:[0], 注意:[1], 戦車:[1], 運動:[0], 仏教:[1], 獄内:[2], 自己紹介:[3], 教育:[0], 深夜:[1], 五感:[0], 枚数:[3], 暴力団:[4], 絶対:[0], 仲:[1], 悲しい:[0, 3], 根:[1], 温泉:[0], 最深:[0], 短期:[1], 終わり:[0], 容易:[0], 著作権:[3, 2], 青銅:[0], 受託:[0], 伺う:[0], 左利き:[0], 銀:[1], 願望:[0], 松:[1], 人格:[0], 災い:[0], 他所:[1], 不潔:[0], 点数:[3], 見直す:[0, 3], 銅像:[0], 不便:[1], 共有:[0], 意見:[1], 庫:[2], 絶望:[0], 降りる:[2], 壊れ物:[0, 5], 仲直り:[3], 神社:[1], 仏:[0, 3], 彼:[1], 徹夜:[0], 器用:[1], 逆効果:[3], 及ぶ:[0, 2], 例外:[0], 式:[2, 1], 犯人:[1], 関西:[1], 夫婦:[1], 詰める:[2], 否決:[0], 洋風:[0], 洋食:[0], 協力:[0], 寿命:[0], 解決:[0], 拠点:[0], 対称:[0], 洋室:[0], 聖地:[1], 泥酔:[0], 促す:[0, 3], 証拠:[0], 女性:[0], 見送る:[0], 塩:[2], 周囲:[1], 男性:[0], 折る:[1], 左側:[0], 反攻:[0], 技能:[1], 果汁:[0], 出獄:[0], 泡:[2], 遠征:[0], 憲法:[1], 親子丼:[4], 温かい:[4], 下着:[0], 緑:[1], 温める:[4], 猫:[1], 若い:[2], 模型:[0], 管理人:[0], 答え:[2], 緊急:[0], 運命:[1], 絵文字:[2, 0], 吐き気:[3], 老人:[0], 干渉:[0], 炎症:[0], 幻覚:[0], 詳細:[0], 根拠:[1], 温度:[1], 宿題:[0], 悲しむ:[3], 作品:[0], 呼ぶ:[0], 助手:[0], 儀式:[1], 穏やか:[2], 俵:[3, 0], 億:[1], 人情:[1], 仮面:[0], 授業:[1], 借財:[0], 利益:[1], 公益:[0], 脱獄:[0], 光年:[0], 感じ:[0], 暗殺:[0], 情熱:[0], 生保:[1], 主因:[0], 数詞:[0], 座敷:[3], 飲み物:[3, 2], 人脈:[0], 落とす:[2], 母親:[0], 証人:[0], 前面:[0, 3], 内臓:[0], 人殺し:[0, 5], 電池:[1], 虎:[0], 笑顔:[1], 当然:[0], 席順:[0], 粉状:[0], 放射能:[3], 用事:[0], 既に:[1], 駅前:[3, 0], 甘党:[0], 中学校:[3], 果物:[2], 切手:[0], 兵士:[1], 心身:[1], 張る:[0], 日程:[0], 総理大臣:[4], 深さ:[2, 1], 湖:[3], 快速:[0], 焼酎:[3], 意識:[1], 一月:[4], 待たせる:[3], 知り合い:[0], 最終:[0], 能力:[1], 移住:[0], 望む:[0, 2], 鍋:[1], 艦船:[0, 1], 両者:[1], 仮説:[0], 進行:[0], 英会話:[3], 集団:[0], 営業:[0], 支局:[2, 0], 枝豆:[0], 俊才:[0], 病気:[0], 仲間:[3], 近所:[1], 扇:[3], 木材:[2, 0], 鼻:[0], 録音:[0], 配る:[2], 照らす:[0, 2], 手伝う:[3], 豆腐:[0, 3], 指:[2], 効率:[0], 剰余金:[0], 姓名:[1], 縄:[2], 私邸:[0], 骨折:[0], 最低:[0], 電波:[1], 残す:[2], 証言:[0, 3], 達する:[0, 3], 不詳:[0], 醤油:[0], 思想:[0], 詩歌:[1, 2], 車輪:[0], 受諾:[0], 担架:[1], 謝る:[3], 帝国:[0, 1], 銀杏:[0], 伝わる:[0], 様々:[2], 英語:[0], 予告:[0], 既決:[0], 支店:[0], 養う:[3, 0], 約する:[3], 映す:[2], 両側:[0], 順番:[0], 習慣:[0], 非難:[1], 七つ:[2], 大衆:[0], 債券:[0], 例文:[0], 完了:[0], 慎む:[3], 被害:[1], 裁判:[1], 誇張:[0], 雲:[1], 運ぶ:[0], 塚:[2], 富裕:[0, 1], 悪例:[0], 美術:[1], 有罪:[0], 油断:[0], 承諾:[0], 許諾:[0], 舌:[2], 鈍感:[0], 助かる:[3], 亡くなる:[0], 黙る:[2], 瞬く:[3], 昼:[2], 危機:[1, 2], 概念:[1], 民俗:[1], 逆:[0], 経験:[0], 卒業:[0], 粉:[2], 念願:[0], 海軍:[1], 満月:[1], 花粉症:[0, 2], 諾否:[1], 特技:[1], 人類学:[3], 余震:[0], 動かす:[3], 借りる:[0], 報告:[0], 血圧:[0], 防止:[0], 乾く:[2], 誤算:[0], 袋:[3], 建つ:[1], 是非:[1], 無茶:[1], 飛ぶ:[0], 乾杯:[0], 決心:[1], 底:[0], 息:[1], 目的:[0], 時計:[0], 食堂:[0], 無名:[0], 贅沢:[3, 4], 郵便箱:[3], 性:[1], 悪い:[2], 血族:[2, 0], 本流:[0], 鳴る:[0], 尋問:[0], 唇:[0], 献金:[0], 医者:[0], 消化不良:[4], 原油:[0], 流行歌:[3], 事情:[0], 駅:[1], 勤め:[3], 貿易:[0], 気温:[0], 探究:[0], 催促:[1], 二十歳:[1], 映像:[0], 存じる:[3, 0], 笑う:[0], 関する:[3], 親:[2], 壊す:[2], 根本:[0, 3], 感じる:[0], 殺す:[0], 芸術:[0], 非常:[0], 寸暇:[1], 神風:[2], 替える:[0], 華やか:[2], 誤字:[1, 0], 性愛:[0], 心理:[1], 例えば:[2], 格好:[0], 不穏:[0], 油絵:[3], 怖がる:[3], 絞殺:[0], 流行語:[0], 建築:[0], 地震:[0], 技:[2], 採用:[0], 賛成:[0], 区分:[0, 1], 地区:[1, 2], 真実:[1], 震度:[1], 一般:[0], 尊い:[3], 方法:[0], 雇用:[0], 敢然:[0], 慈愛:[0, 1], 兵器:[1], 悪因悪果:[5], 幻想:[0], 水害:[0], 無害:[1], 穴:[2], 官金:[0], 発泡:[0], 表情:[3], 指先:[0, 3], 栄光:[0], 説明:[0], 薬物:[2, 0], 弓道:[1], 火災:[0], 沖合:[0], お兄さん:[2], 血液:[2], 劇団:[0], 梅酒:[0], 無知:[1], 小説:[0], 知識:[1], 訓読み:[0], 忘れ物:[0], 正確:[0], 凍死:[0], 夫妻:[1, 2], 拳骨:[0], 将軍:[0], 湯:[1], 原作:[0], 察知:[1, 0], 空席:[0], 交渉:[0], 無力:[1], 存在:[0], 電力:[1, 0], 稲穂:[0], 動き:[3], 右側:[0], 塩水:[2], 自愛:[0, 1], 薬方:[0], 警察:[0], 機械:[2], 後ろ盾:[0], 構える:[3], 衛星:[0], 西側:[0], 感覚:[0], 煙い:[0, 2], 産業:[0], 病棟:[0], 幽閉:[0], 畳:[0], 軍:[1], 宗派:[1], 復旧:[0], 毛:[0], 察する:[0, 3], 梅:[0], 地価:[1, 2], 笑い:[0], 姿勢:[0], 各自:[1], 私営:[0], 坊さん:[0], 凍結:[0], 姿:[1], 主将:[0], 脳死:[1, 0], 罰する:[0, 3], 電子:[1], 弓:[2], 洗車:[0], 提案:[0], 政策:[0], 連盟:[0], 核実験:[3], 丈:[2], 借用:[0], 脳:[1], 洗脳:[0], 応じる:[0, 3], 統合:[0], 大概:[0], 熟語:[0], 不法:[0], 本能:[1, 0], 対外:[0], 上品:[3], 分類:[0], 資本:[0], 副題:[0], 態度:[1], 停止:[0], 利息:[0], 生存:[0], 楽しい:[3], 等号:[0], 会社:[0], 急ぐ:[2], 借金:[3], 前景:[0], 定量:[0, 3], 浜:[2], 有益:[0], お母さん:[2], 日本語:[0], 暮らす:[0], 年賀状:[3, 0], 腕:[2], 盟約:[0], 遺産:[0], 富む:[1], 昨年:[0], 百万:[3], 書き入れる:[4, 0], 体験:[0], 年額:[0], 歓迎:[0], 憎らしい:[4], 盲点:[1, 3], 作り方:[4, 5], 足:[2], 異性:[0, 1], 胴体:[1], 在外:[0], 医師:[1], 曲:[0, 1], 資格:[0], 美術館:[3], 馬:[2], 兵:[1], 毎度:[0], 歌舞伎:[0], 機嫌:[0], 任務:[1], 規則:[2, 1], 再来年:[0], 急:[0], 小豆:[3], 市営:[0], 甘い:[0], 核:[1, 2], 究明:[0], 暑い:[2], 比率:[0], 優勝:[0], 無職:[1], 宅:[0], 研究:[0], 早退:[0], 爪:[0], 劣等感:[3], お土産:[0], 小指:[0], 一個:[1], 悪夢:[1], 災難:[3], 感謝:[1], 月末:[0], 冷静:[0], 聖日:[0], 沿海:[0], 国債:[0], 悪女:[1], 危険:[0], 汽笛:[0], 手洗い:[2], 宴:[0], 水曜日:[3], 元:[2], 祭:[0], 取り出す:[3, 0], 不可欠:[2], 日曜日:[3], 汽船:[0], 不等:[0], 幹:[1], 壊れる:[3], 静々:[1], 菜食:[0], 個人:[1], 個室:[0], 厚い:[0], 自宅:[0], 磁気:[1], 推薦:[0], 換える:[0], 霧:[0], 終わる:[0], 勝負:[1], 継父:[1], 養子:[0], 僧院:[0], 喫煙:[0], 人種:[0], 公害:[0], 担当:[0], 兵隊:[0], 爪切り:[3, 0], 仙人:[3], 忘れる:[0], 訓練:[1], 可能:[0], 静止:[0], 一夫多妻:[1, 1], 貼る:[1], 形容詞:[3], 換気:[0], 詐欺師:[2], 吸い殻:[0], 報じる:[0, 3], 試みる:[4], 加える:[0, 3], 確率:[0], 予防:[0], 昇給:[0], 六つ:[3], 周年:[0], 行為:[1], 紡織:[0], 内容:[0], 対比:[0, 1], 混乱:[0], 実在:[0], 余裕:[0], 散る:[0], 変換:[0], 狐:[0], 日焼け:[0], 非常に:[0], 残余:[1], 妨げる:[4], 経つ:[1], 込める:[2], 受付:[0], 追い越す:[3], 口紅:[0], 挙がる:[0], 助詞:[0], 妨害:[0], 建設:[0], 境界:[0], 血管:[0], 医大:[0], 感心:[0], 腐る:[2], 原子力:[3], 節句:[0], 名詞:[0], 自動詞:[2], 防水:[0], 抗体:[0], 多忙:[0], 改正:[0], 旧姓:[0], 不健康:[2], 胸:[2], 静か:[1], 改善:[0], 書評:[0], 実際:[0], 包む:[2], 貧乏人:[0], 詐取:[1], 困る:[2], 暴走:[0], 私財:[1, 0], 宇宙人:[2], 親展:[0], 軍艦:[0], 乾季:[1], 思い詰める:[5, 0], 遅刻:[0], 財布:[0], 裕福:[1, 0], 動詞:[0], 往復:[0], 津波:[0], 闇:[2], 輝き:[0, 4], 無限:[0], 駐留軍:[3], 介入:[0], 医療:[1, 0], 面倒:[3], 交差点:[0, 3], 官庁:[1], 環境:[0], 象:[1], 比較:[0], 汗:[1], 移動:[0], 一人娘:[4], 及第:[0], 治療:[0], 批判:[0], 定義:[1, 3], 遠視:[0], 事故:[1], 汗臭い:[4], 怪獣:[0], 信頼:[0], 継ぐ:[0], 選挙:[1], 審査:[1], 続ける:[0], 手続き:[2], 他動詞:[2], 河:[2], 突然:[0], 維持:[1], 松葉:[1], 減法:[1, 0], 容疑者:[3], 減らす:[0], 口笛:[0, 3], 挙げる:[0], 法規:[1], 大量:[0], 豚肉:[0], 故障:[0], 開閉:[0], 著作:[0], 費用:[1], 講義:[3], 廃止:[0], 朝霧:[2], 浦:[2], 恐怖:[1, 0], 花柳:[0], 議会:[1], 捜索:[0], 増税:[0], 設ける:[3], 損:[1], 審判:[0], 一筋:[2], 素敵:[0], 判断:[1], 主義:[1], 義務:[1], 通販:[0], 献血:[0], 自制:[0], 事務所:[2], 急増:[0], 素材:[0], 公設:[0], 経済学:[3], 了解:[0], 製作:[0], 他人:[0], 峰:[2], 似合う:[2], 副詞:[0], 罰金:[0], 価値観:[3, 2], 寸法:[0], 警察庁:[4, 3], 武道:[1], 近視:[0], 禁句:[0], 早々:[0], 窓:[1], 坊主:[1], 区域:[1], 失態:[0], 防犯:[0], 舞踏:[0], 吐き出す:[3, 0], 竹の子:[0], 馬鹿:[1], 各地:[1], 社費:[1], 原型:[0], 視覚:[0], 所載:[0], 量:[1], 眠る:[0], 航空:[0], 痛み止め:[0], 跳躍:[0], 脱線:[0], 観念:[1], 製品:[0], 針医:[2], 保障:[0], 虫:[0], 略図:[0], 零点:[3, 0], 昼寝:[0], 位置:[1], 脱字:[0], 過去:[1], 質問:[0], 違う:[0], 慣れる:[2], 差す:[1], 希望:[0], 見える:[2], 勧める:[0], 典型的:[0], 置き場:[0], 触る:[0], 気違い:[3], 朝:[1], 隙:[0], 公営:[0], 地域:[1], 公示:[0, 1], 罰:[1], 展開:[0], 鉛:[0], 鉛管:[0], 免れる:[4], 平均:[0], 核兵器:[3], 鉢:[2], 支援:[0], 観光:[0], 伝統的:[0], 主観的:[0], 量る:[2], 回る:[0], 蛇:[1], 吸う:[0], 大嫌い:[1], 領土:[1], 領収書:[0], 管:[1], 字幕:[0], 劇場:[0], 朝日:[1], 剣:[1], 案外:[1, 0], 伝統:[0], 気象:[0], 効果:[1], 豊か:[1], 痛み:[3], 入れる:[0], 先ず:[1], 新鮮:[0], 浮く:[0], 痛む:[2], 差別:[1], 金属:[1], 肥満:[0], 鮮魚:[1], 懐かしい:[4], 押す:[0], 廃れる:[0, 3], 俳優:[0], 信号:[0], 吸収:[0], 基準:[0], 弁護士:[3], 影:[1], 寸前:[0], 一年生:[3], 枕:[1], 踏む:[0], 躍る:[0], 法律:[0], 酒造:[0], 間違い:[3], 患う:[0, 3], 一巻:[3], 弁償:[0], 統括:[0], 伊達:[0], 俳句:[0], 求職:[0], 収入:[0], 時候:[0], 不況:[0], 豊満:[0], 隠居:[0], 後輩:[0], 募る:[2], 注文:[0], 小遣い:[1], 各駅停車:[5], 満員:[0], 驚かす:[4], 側:[0], 大陸:[0, 1], 応募:[1, 0], 別冊:[0], 職業:[2], 天候:[0], 効く:[0], 呼ばれる:[0], 居る:[0], 勝手:[0], 貸し:[0], 背景:[0], 遺跡:[0], 優先:[0], 魔:[0, 1], 責任感:[3], 集まり:[3, 0], 彼女:[1], 船酔い:[0], 役割:[3, 0], 規律:[0], 抜く:[0], 渡る:[0], 隠す:[2], 巻尺:[0], 着く:[1, 2], 届く:[2], 恥ずかしい:[4], 現す:[3], 健康:[0], 運河:[1], 熊:[2, 1], 酢:[1], 暮らし:[0], 味方:[0], 寛ぐ:[3], 冷やす:[2], 女優:[0], 名刺:[0], 特徴:[0], 獣類:[1], 兆候:[0], 盗む:[2], 技術:[1], 独り:[2], 稲:[1], 再開:[0], 怪談:[0], 獣:[0], 人造:[0], 効果的:[0], 絞る:[2], 移す:[2], 出版:[0], 障子:[0], 退屈:[0], 遊ぶ:[0], 故意:[1], 風邪:[0], 分:[1], 燃え付く:[3], 同僚:[0], 版権:[0], 多い:[1, 2], 平ら:[0], 激励:[0], 創造:[0], 恐怖症:[3, 0], 輸入:[0], 診断:[0], 開く:[0], 印:[0], 幾度:[1], 越える:[0], 構造:[0], 造園:[0], 読み違い:[0], 純毛:[0], 差し上げる:[0, 4], 光景:[0, 1], 激しい:[3], 観覧:[0], 充実:[0], 再来月:[0, 2], 届ける:[3], 燃える:[0], 製造:[0], 冷房:[0], 丸ごと:[0], 乾かす:[3], 書き方:[3], 出席:[0], 停電:[0], 担う:[2], 鉛筆:[0], 人違い:[3], 郵便:[0], 独学:[0], 澄ます:[2], 車内:[1], 回復:[0], 象徴:[0], 無我:[1], 貯金:[0], 改造:[0], 休学:[0], 奏楽:[0], 悪影響:[3], 居酒屋:[0, 3], 墓地:[1], 吸血鬼:[4, 3], 離す:[2], 宝:[3], 併殺:[0], 納得:[0], 緩い:[2], 電柱:[0], 占める:[2], 刺す:[1], 従う:[0, 3], 障る:[0], 小規模:[3], 窮状:[0], 暗礁:[0], 我々:[0], 振動:[0], 独特:[0], 南極:[0], 中華:[1], 直径:[0], 通貨:[1], 一般的:[0], 漂着:[0], 恐れる:[3], 英雄:[0], 癖:[2], 田舎:[0], 素晴らしい:[4], 責める:[2], 飛ばす:[0], 野獣:[0], 悩み:[3], 階段:[0], 皇帝:[0], 音楽:[1], 腹切り:[0], 越す:[0], 暇:[0], 圧迫:[0], 迷路:[1], 頭痛:[0], 片言:[0], 南極圏:[4, 3], 長靴:[0], 文字:[1], 陸軍:[2], 頼る:[2], 就業:[0], 極端:[3], 積む:[0], 大将:[1], 迷子:[1], 独身:[0], 結婚式:[3], 生卵:[3, 4], 堰:[0], 給油:[0], 就く:[1, 2], 極楽:[0, 4], 症状:[3], 供給:[0], 志望:[0], 眼球:[0], 込む:[1], 野暮:[1], 盤:[1], 雇う:[2], 踊り:[0], 迫害:[0], 誘惑:[0], 先端:[0], 段階:[0], 閣議:[1], 内緒話:[4], 頻繁:[0], 主に:[1], 焦り:[3], 締める:[2], 織る:[1], 貸す:[0], 祖母:[1], 熟れる:[2], 杉:[0], 帝:[0], 訪ねる:[3], 美味しい:[0, 3], 興味:[1], 傷者:[1], 通訳:[1], 観測:[0], 感銘:[0], 先々月:[3, 0], 誘う:[0], 指摘:[0], 主観:[0], 怒気:[1], 初版:[0], 雑音:[0], 温暖:[0], 臨む:[0], 織物:[2, 3], 鍛える:[3], 迷う:[2], 娘:[3], 給料:[1], 略語:[0], 講師:[1], 銅山:[1], 疲れ:[3], 迎える:[0], 宴会:[0], 欧米:[0], 渇く:[2], 航空券:[3], 採算:[0], 政党:[0], 汚染:[0], 戻り道:[3], 未遂:[0], 恩賞:[0], 有る:[1], 要請:[0], 閣僚:[0, 2], 捨てる:[0], 密会:[0], 秘める:[2], 異状:[0], 倒壊:[0], 中欧:[0], 鈴:[0], 春巻き:[0], 検索:[0], 請求:[0], 傷める:[3], 無糖:[0], 独唱:[0], 怖い:[2], 宗教:[1], 催告:[0], 航法:[0, 1], 直航:[0], 診察:[0], 泥水:[0], 染める:[0], 水溶性:[0], 茂る:[2], 仏徒:[1], 攻撃:[0], 回数券:[3], 幼児:[1], 軍隊:[1], 主催:[0], 看板:[0], 睡眠薬:[3], 麻酔:[0], 倉:[2], 強烈:[0], 順序:[1], 採る:[1], 社会党:[0], 密輸:[0], 汚点:[0], 携わる:[4], 箸:[1], 傾ける:[4], 金庫:[1], 幼稚:[0], 怒り:[3], 服飾:[0], 兄貴:[1], 舞う:[0, 1], 潜る:[2], 超す:[0], 奇数:[2], 冷たい:[0, 3], 三杯:[1], 大略:[0], 締まる:[2], 精神病:[0], 敷く:[0], 奇妙:[1], 遊園地:[3], 灰:[0], 最初:[0], 盛る:[0, 1], 装置:[1], 裏通り:[3], 戒める:[4], 男優:[0], 御飯:[1], 不適:[0], 沢:[2], 灰皿:[0], 装い:[3, 0], 聴く:[0], 警戒:[0], 保守的:[0], 傘:[1], 精一杯:[3, 1], 過ぎ:[2], 水仙:[0], 操:[0], 著者:[1], 裏口:[0], 言い訳:[0], 復習:[0], 蒸れる:[2], 一本気:[3], 翔る:[2], 組織:[1], 除外:[0], 皇太子:[3], 誤解:[0], 誤用:[0], 破片:[0], 包丁:[0], 液晶:[0], 靴屋:[2], 画廊:[0], 否定:[0], 仲良し:[2], 経済:[1], 詰め込む:[0, 3], 独創:[0], 沿線:[0], 炭鉱:[0], 週末:[0], 入り口:[0], 矢印:[2], 太陽:[1], 卵:[2, 0], 鉛毒:[1, 0], 真似:[0], 呼び鈴:[0], 果樹:[1], 消化:[0], 風潮:[0], 融合:[0], 広い:[2], 離婚:[0], 試験:[2], 監督:[0], 印鑑:[0, 3], 普段:[1], 桜肉:[3], 偽る:[3], 孫:[2], 巣:[1, 0], 半径:[1], 墓:[2], 背中:[0], 恩人:[0, 3], 銭:[1], 砂漠:[0], 免疫:[0], 辛子:[0], 倉庫:[1], 地帯:[1], 富:[1], 道徳:[0], 採決:[0, 1], 桜:[0], 降参:[0], 枢軸:[0], 未婚:[0], 体系的:[0], 子孫:[1], 序文:[0], 解散:[0], 意志:[1], 液体:[0], 先祖:[1], 複雑:[0], 食欲:[0, 2], 免状:[0, 3], 照明:[0], 外れ:[0], 背:[1], 手紙:[0], 番号:[3], 新婚旅行:[5], 騒音:[0], 秘密:[0], 訳語:[0], 英訳:[0], 処理:[1], 増加:[0], 憲政:[0], 快感:[0], 盗作:[0], 裏切る:[3], 焼き芋:[0], 神聖:[0], 推理:[1], 承認:[0], 明瞭:[0], 信仰:[0], 雷:[3, 4], 不快:[0], 貧乏:[1], 肉欲:[0], 諸々:[0], 亀:[1], 炎:[1], 漂流:[0], 程:[0, 2], 入隊:[0], 騒ぐ:[2], 浮かれる:[0], 傷心:[0], 汚水:[0], 和訳:[0], 芋:[2], 砂丘:[0], 他:[0], 鋼:[0], 密か:[2, 1], 並列:[0], 車庫:[1], 身振り:[1], 維新:[1], 訳者:[1], 縁起:[0], 婦人:[0], 郵便局:[3], 垂らす:[2], 延長:[0], 小麦粉:[0, 3], 忠実:[0], 縮小:[0], 縦:[1], 縮まる:[0], 緩める:[3], 貯金箱:[2], 太陽系:[0], 購入:[0], 閉める:[2], 閉店:[0], 垂直:[0], 粋:[0], 戻る:[2], 総括:[0, 1], 数字:[0], 乏しい:[3], 更新:[0], 漏水:[0], 宝石:[0], 敬語:[0], 皇族:[0], 湾:[1], 至る:[2], 争う:[3], 特急:[0], 従来:[1], 手掛かり:[2], 国宝:[0], 磁場:[1, 2], 削る:[0], 修辞学:[3], 泊まり:[0], 修理:[1], 刺身:[3], 超音波:[3], 派遣:[0], 荒々しい:[5], 上がる:[0], 非常口:[2], 塁:[1], 甲斐:[0], 悲惨:[0], 狙い:[0], 仰天:[0], 喪服:[0], 祖父母:[2], 書き込む:[3, 0], 患者:[0], 戦闘:[0], 寸:[1], 次々:[2], 試験地獄:[4], 弾:[2], 偽物:[0], 雌:[2], 急患:[0], 証跡:[0], 契約:[0], 栄誉:[1], 比較的:[0], 闘志:[1], 申し込む:[4, 0], 忘年会:[3], 酔っ払い:[0], 漁業:[1], 執筆:[0], 崩壊:[0], 火葬:[0], 群れ:[2], 制度:[1], 仮に:[0], 劇:[1], 模様:[0], 掲載:[0], 足跡:[3], 銃:[1], 恥知らず:[3], 頼む:[2], 扉:[0], 消費:[0, 1], お婆さん:[2], 残り:[3], 防火:[0], 暴走族:[3], 休暇:[0], 飢え:[2], 群がる:[3], 投げ捨てる:[0, 4], 効力:[1], 汚す:[0], 奴:[1], 焼き鳥:[0], 賀状:[0], 河豚:[1], 依頼:[0], 常勤:[0], 腐敗:[0], 下旬:[0], 自爆:[0], 削減:[0], 狙撃:[0], 要項:[0], 本塁打:[3], 奇襲:[0], 大砲:[0], 源氏:[0], 払い:[2], 終身刑:[3], 大抵:[0], 旬:[1, 0], 前兆:[0], 臨時:[0], 掲示:[0], 囲碁:[1], 括弧:[1], 功績:[0], 源:[0], 勝ち:[2], 心願:[0, 1], 枝:[0], 跡継ぎ:[2, 3], 跳ねる:[2], 変態:[0], 酔う:[1], 終点:[0], 水彩画:[0], 勢い:[3], 訴える:[4, 3], 株式会社:[5], 下さい:[3], 購読:[0], 鹿:[0, 2], 浸る:[0, 2], 規模:[1], 総理府:[3], 棒:[0], 牙:[1], 借家:[0], 相談:[0], 政治:[0], 焼き肉:[0], 資金:[2, 1], 見抜く:[2], 合わせる:[3], 削除:[1], 縁:[2], 舞踏会:[2], 馬鹿らしい:[4], 避妊:[0], 基盤:[0], 粘土:[1], 先:[0], 崖:[0], 駅長:[0], 済ます:[2], 供える:[3], 含む:[2], 草刈り:[3, 4], 淡い:[2], 対立:[0], 現在:[1], 超音速:[3], 縄張り:[0], 朱:[0], 溝:[0], 万人:[0, 3], 診る:[1], 皿洗い:[3], 信心:[3, 1], 昨今:[1], 燃やす:[0], 甘酢:[0], 水道:[0], 飛躍:[0], 香辛料:[3], 登る:[0], 無意識:[2], 家庭:[0], 大佐:[0], 波:[2], 出る:[1], 勧告:[0], 文句:[1], 免許:[1], 民族:[1], 国籍:[0], 訳す:[2], 仕方:[0], 通信網:[3], 不純:[0], 払う:[2], 漫才:[3], 名字:[1], 試食:[0], 皮革:[0, 2], 眺める:[3], 謙虚:[1], 葉:[0], 掛軸:[2], 退く:[3], 願い事:[0, 5], 分裂:[0], 感涙:[0], 板:[1], 宿泊:[0], 営む:[3], 圏外:[1], 稲田:[0], 黙殺:[0], 光輝:[1], 王妃:[1], 引き分け:[0], 円盤:[0], 獣医:[1], 隆盛:[0], 充電:[0], 稲作:[0], 短銃:[0], 誰:[1], 一瞬:[0], 辱める:[5], 家畜:[0], 所:[0], 払い戻す:[5, 0], 検査:[1], 致す:[2], 傾く:[3], 描画:[0], 逃亡:[0], 福祉:[2, 0], 木曜日:[3], 盛り上がる:[4, 0], 親不孝:[3, 4], 侵す:[2, 0], 壁紙:[0], 免税:[0], 銃弾:[0], 製鋼:[0], 番組:[0], 破れる:[3], 染まる:[0], 貴様:[0], 黒幕:[0], 納豆:[3], 極めて:[2], 体積:[1], 門扉:[1], 震源地:[3], 労働者:[3], 味:[0], 映画館:[3], 提供:[0], 更衣室:[3], 手袋:[2], 遺伝子:[2], 全般的:[0], 宜しい:[3, 0], 致命的:[0], 奥:[1], 一人称:[3], 一緒:[0], 補佐:[1], 役人:[0], 入江:[0], 日本的:[0], 飯:[2], 日常:[0], 虚弱:[0], 裸足:[0], 道:[0], 染み:[0], 丼:[0], 注射:[0], 単純:[0], 歓楽街:[4], 損なう:[3], 全損:[0], 紹介状:[0, 3], 揺れる:[0], 全国:[1], 歩道:[0], 添付:[1, 0], 預金:[0], 盛り上げる:[4], 納まる:[3], 破る:[2], 味噌汁:[3], 猛烈:[0], 省略:[0], 合図:[1], 自家製:[0], 蒸し暑い:[4], 彫刻:[0], 贈る:[0], 廃墟:[1], 詐欺:[1], 移民:[0], 割引:[0], 略す:[2], 推測:[0], 破壊:[0], 庁舎:[1], 真剣:[0], 福寿:[2], 魚雷:[0], 掌握:[0], 普及:[0], 遺体:[0], 油田:[0], 予測:[0], 味噌:[1], 継承:[0], 縄文:[0], 粘る:[2], 火鉢:[1], 同盟:[0], 幅:[0], 廃絶:[0], 摘む:[0], 伸ばす:[2], 踏み込む:[3], 乗り換える:[4, 3], 年齢:[0], 仮称:[0], 畜生:[3], 眠り薬:[4], 塔:[1], 生還:[0], 真っ黒:[3], 朝刊:[0], 還元:[0], 溶岩:[1, 0], 躍り:[0], 愛人:[0], 拳銃:[0], 早瀬:[0], 瀬:[0, 1], 措置:[1], 樹皮:[1], 蜂:[0], 無縁:[0], 蜂蜜:[0], 記帳:[0], 拳:[0, 1], 枠組み:[0, 4], 積もる:[2, 0], 概算:[0], 賞金:[0], 葉書:[0], 含意:[1], 徹する:[0, 3], 冒険:[0], 面積:[1], 既存:[0], 跳ぶ:[0], 哲学:[2, 0], 辛い:[2], 憎い:[2], 本屋:[1], 壮行:[0], 索引:[0], 露出:[0], 垣:[2], 沈滞:[0], 安泰:[0], 辛勝:[0], 釣る:[0], 丈夫:[0], 謎々:[0], 優雅:[1], 昭和:[0, 1], 輪:[1], 牧師:[1, 0], 明朗:[0], 威厳:[0], 謎:[0], 尼:[1, 0], 牧草:[0], 旨い:[2], 徹底:[0], 商店街:[3], 衝撃:[0], 山岳:[0], 一斉:[0], 揺さぶる:[0], 凶悪:[0], 遅咲き:[0], 漁師:[1], 血液型:[0], 排他:[0], 刷る:[1], 壊滅:[0], 挑戦者:[3], 揚げ:[0], 水滴:[0], 覚悟:[1, 2], 旅館:[0], 漁船:[0], 新鋭:[0], 頻度:[1], 朗報:[0], 叫ぶ:[2], 本棚:[1], 細菌:[0], 偶然:[0], 漏出:[0], 転覆:[0], 刑務所:[3, 0], 刑罰:[1], 排気:[0], 満潮:[0], 封書:[0], 紛れる:[3], 遂行:[0], 降車:[0, 1], 殿様:[0], 吹き出す:[3, 0], 廃棄:[1, 0], 刃物:[1], 扇風機:[3], 塗布:[1], 刑事:[1], 泥沼:[0], 珠算:[0], 吹き込む:[3, 0], 潮流:[0], 刃先:[0, 3], 滝:[0], 畜産:[0], 連峰:[0], 募金:[0], 即座:[1], 素粒子:[2], 挿話:[0], 盆踊り:[3], 脇:[2], 運搬:[0], 募集:[0], 公園:[0], 失恋:[0], 過敏:[0], 蜜:[1], 雅楽:[1], 叱る:[0, 2], 仰々しい:[5], 偽装:[0], 執る:[1], 性格:[0], 埋もれる:[0], 撤兵:[0], 放棄:[1], 麦畑:[3], 仁:[1], 即死:[0], 請願:[0], 防腐剤:[3, 0], 手堅い:[3, 0], 吹く:[1, 2], 拠る:[0], 炭素:[1], 仁義:[1], 垣根:[2, 3], 紛らわしい:[5], 検疫:[0], 忍者:[1], 綿布:[1], 迷わす:[3], 内堀:[0], 造る:[2], 巡回:[0], 謙遜:[0], 祝儀:[1], 朱印:[0], 潮時:[0], 宙:[1], 揺する:[0], 電話:[0], 薬剤師:[3], 原子:[1], 社会福祉:[5, 4], 瀬戸:[1], 慰問:[0], 挑戦:[0], 身体:[1], 鼻先:[0], 巡礼:[0], 潜む:[2], 侵害:[0], 偽:[0], 分析:[0], 球威:[1], 恐竜:[0], 丘:[0], 店員:[0], 肌触り:[3], 日韓:[1], 握力:[2], 原潜:[0], 石炭:[3], 田畑:[1], 到着:[0], 解析:[0], 麻:[2], 投棄:[1], 返り咲き:[0], 懇意:[1], 足りる:[0], 白菊:[2], 夢中:[0], 包囲:[1], 誠意:[1], 忠誠:[0], 移る:[2], 礼儀:[3], 駐日:[0], 植樹:[0], 潜水:[0], 脱衣:[0, 1], 偽造:[0], 克明:[0], 高炉:[1, 0], 竜:[1], 髪:[2], 先程:[0], 覆面:[0], 保存:[0], 生殖:[0], 撤去:[1], 蛍:[1], 航空母艦:[5], 鉱物:[1], 滅亡:[0], 幻滅:[0], 芝草:[0], 撤回:[0], 潜在意識:[5], 鉱業:[1], 暫く:[2], 範:[1], 焦点:[1], 哲学者:[3, 4], 娯楽:[0], 唯物論:[4], 網戸:[2], 鉱山:[1], 繁栄:[0], 艦隊:[0, 1], 衣:[0], 発掘:[0], 柔道:[1], 左翼:[1], 迎え:[0], 並べる:[0], 宜しく:[2, 0], 滅ぼす:[3], 小舟:[0], 冬至:[0], 原爆:[0], 鉱石:[0], 沼田:[0], 雑巾:[0], 憩う:[2], 毎朝:[1, 0], 斎場:[0], 沼地:[0], 梨:[2, 0], 澄む:[1], 肌:[1], 凶器:[1], 脚:[2], 可也:[1], 暦:[3, 0], 薬剤:[0, 2], 撲滅:[0], 滋養:[0], 不吉:[0], 侍:[0], 芽:[1], 稼ぎ:[1, 3], 穏当:[0], 咲く:[0], 翼:[0], 双子:[0], 肝炎:[1], 刃:[1], 桃色:[0], 俺:[2], 一匹:[4], 釣り:[0], 嵐:[1], 笠:[1], 戸棚:[0], 網:[2], 揚げ出し:[0], 開封:[0], 福袋:[3], 透明:[0], 隣人:[0], 決裂:[0], 原子炉:[3], 粒子:[1], 租税:[1, 0], 隣家:[1], 叫び:[3], 変化:[1], 異義:[1], 不透明:[2], 堅い:[0, 2], 浴衣:[0], 年頃:[0], 呪い:[0, 3], 租界:[0], 勘弁:[1], 結婚:[0], 綱:[2], 引き裂く:[3], 近距離:[3], 狩り:[1], 近頃:[2], 呪う:[2], 滴る:[3], 桑畑:[3], 欲求:[0], 潮:[0], 良い:[1], 褒める:[2], 書斎:[0], 暫定:[0], 石垣:[0], 塾:[1], 西暦:[0], 無菌:[0], 魔術:[1], 桑:[1], 真珠:[0], 干潟:[0], 鋭敏:[0], 荒れる:[0], 朗らか:[2], 沼:[2], 暖炉:[1], 炉心:[0], 霊園:[0], 主:[1], 執着:[0], 飼う:[1], 珍味:[1, 0], 相撲:[0], 金髪:[0], 勘:[0], 好奇心:[3], 吹き飛ばす:[4, 0], 掘る:[1], 貢献:[0], 懇親:[0], 沼沢:[0], 曇る:[2], 墨:[2], 陶器:[1], 人数:[1], 延ばす:[2], 懸かる:[2], 挑発:[0], 紛らす:[3], 逆襲:[0], 曇り:[3], 裸:[0], 賭け:[2], 入れ墨:[0], 時間:[0], 不自由:[1], 食事:[0], 鋭利:[1], 趣味:[1], 慰安:[0], 論旨:[1], 髪の毛:[3], 鳩:[1], 悲哀:[0, 1], 偏り:[0, 4], 印刷:[0], 疲労:[0], 排水溝:[0, 3], 半裸:[1, 0], 答える:[3, 2], 塁審:[0], 再建:[0], 荒らす:[0], 珍:[1], 即日:[0], 鈍器:[1], 賭ける:[2], 繰り返す:[3, 0], 伺い:[0], 髪型:[0], 封:[1], 注ぐ:[0, 2], 商売:[1], 整然:[0], 信じる:[3], 塾生:[0], 加湿器:[3], 見分ける:[0, 3], 戻す:[2], 黒潮:[0], 海溝:[0], 清涼:[0], 鶴:[1], 快い:[4], 磨く:[0], 川底:[0], 湿地:[0], 猿:[1], 瞳:[0], 零時:[1], 抽選:[0], 辛抱:[1], 曲がる:[0], 恐ろしい:[4], 熱:[2], 建てる:[2], 外側:[0], 従業:[0], 繁殖:[0], 腹立つ:[3], 景色:[1], 子猫:[2], 関西弁:[0], 上旬:[0], 浸透:[0], 荒い:[0, 2], 亡霊:[0], 零:[1], 盗撮:[0], 交じる:[2], 湿気:[0], 教訓:[0], 中旬:[0], 衝突:[0], 綱引き:[2], 棚:[0], 嫁:[0], 飢える:[2], 旗:[2], 大変:[0], 戒告:[0], 獲得:[0], 擦る:[1], 嫁ぐ:[2], 狂気:[1], 国旗:[0], 学問:[2], 聴力:[1], 主唱:[0], 洗剤:[0], 薄情:[0], 横綱:[0], 憎しみ:[0], 更に:[1], 堀:[2], 円弧:[1], 中軸:[0], 硬い:[0, 2], 硬直:[0], 先頃:[2, 0], 魂:[1], 義塾:[1], 磨き:[0], 滝川:[0], 中枢:[0], 範囲:[1], 模範:[0], 紛糾:[0], 糾弾:[0], 芝:[0], 頃:[1], 卓:[0, 1], 培う:[3], 諮る:[2], 耐える:[2], 塗る:[0], 悟る:[0, 2], 刈る:[0], 尼僧:[0, 1], 概要:[0], 潤う:[3], 翻る:[3], 悔やむ:[2], 紫外線:[0], 気概:[0], 一概に:[0, 2], 謀る:[2], 隔てる:[3], 数珠:[2, 0], 奨学金:[0], 漂う:[3], 誓約:[0], 剛健:[0], 唯一:[1], 浸水:[0], 無謀:[0], 老衰:[0], 勘案:[0], 妃:[1], 紫:[2], 試合:[0], 魔法使い:[4], 暗闇:[0], 隙間:[0], 理不尽:[2], 霜:[2], 尽力:[1, 0], 賢い:[3], 賢人:[0], 輝度:[1], 塗装:[0], 台詞:[0], 帝国主義:[5], 備蓄:[0], 屈辱:[0], 鉢巻:[2], 餓死:[1], 耐火:[0], 麻布:[0], 斜め:[2], 殴打:[1], 忍耐:[1], 手帳:[0], 飢餓:[1], 油彩:[0], 記憶:[0], 街灯:[0], 後悔:[1], 脇見:[3, 2], 脇役:[0], 塗料:[1], 脅し:[0], 土塀:[0], 詐称:[0], 少佐:[0], 中佐:[0], 欠如:[1], 老婆:[1], 貨幣:[1], 車掌:[0], 電話帳:[0], 上唇:[4, 3], 砕石:[0], 粉砕:[0], 花柳界:[2], 哀れ:[1], 休憩:[0], 点滴:[0], 炊飯器:[3], 虹:[0], 柳:[0], 哀れむ:[3], 撃墜:[0], 突如:[1], 芯:[1], 帳簿:[0], 搬出:[0], 変更:[0], 鰐:[1], 伯母:[0], 遺失:[0], 完全:[0], 爆発:[0], 洞:[2, 1], 邪魔:[0], 鬱気:[0], 代わる:[0], 蟹:[0], 無駄:[0], 法廷:[0], 銘々:[3], 堤:[3, 0], 堤防:[0], 水晶:[1], 空洞:[0], 編者:[1], 巧妙:[0], 邪:[0], 翻訳:[0], 皇后:[3], 墳墓:[1], 壮大:[0], 搬送:[0], 疫病:[0], 漏れる:[2], 推定:[0], 不器用:[2], 余る:[2], 朝寝坊:[3], 怒鳴る:[2], 承知:[0], 爆笑:[0], 奮起:[1], 暗記:[0], 押入れ:[0], 成熟:[0], 警察署:[5, 0], 優秀:[0], 地蔵:[0, 2], 弾む:[0], 照れる:[2], 申す:[1], 強盗:[0], 人込み:[0], 別人:[0], 短刀:[3, 0], 不文律:[2], 満足:[1], 盗品:[0], 花見:[3], 同感:[0], 機敏:[0], 主位:[1], 働く:[0], 論文:[0], 下巻:[0], 額:[0, 2], 幼稚園:[3], 大損:[0, 3], 宝くじ:[3], 昔:[0], 難しい:[4, 0], 尊敬語:[0], 厄介:[1], 酢の物:[2], 油:[0], 聞こえる:[0], 切符:[0], 聴者:[1], 投げる:[2], 専門:[0], 外観:[0], 日系:[0], 交互:[1], 村:[2], 指揮者:[2], 企画:[0], 面倒臭い:[6], 高血圧:[4, 3], 天気:[1], 絶える:[2], 盗聴:[0], 地上:[0], 全部:[1], 翌月:[0], 天使:[1], 都市:[1], 水着:[0], 増える:[2], 確かめる:[4], 拒否:[1], 全壊:[0], 渋い:[2], 健忘症:[0], 慎重:[0], 奇跡:[0, 2], 詳しい:[3], 舞台:[1], 合計:[0], 寝坊:[0], 優しい:[0, 3], 品質:[0], 房:[2], 可分:[0], 遺伝:[0], 弾丸:[0], 貝:[1], 薬学:[0, 2], 割れる:[0], 遣う:[0], 雷雨:[1], 撮る:[1], 一人暮らし:[4], 遅い:[0, 2], 償う:[3], 核分裂:[3], 腕時計:[3], 境:[2], 越権:[0], 雰囲気:[3], 続々:[0, 1], 懸ける:[2], 懸命:[0], 管制塔:[0], 適当:[0], 預ける:[3], 拡張:[0], 闘う:[0], 鋼材:[0], 兼ねる:[2], 排水:[0], 犠打:[1], 薄い:[0, 2], 低い:[2], 陣:[1], 唱歌:[1], 控える:[3, 2], 手の甲:[1], 恨み:[3], 背丈:[1], 年中:[1], 強力:[0], 殴り込み:[0], 駅員:[2, 0], 座席:[0], 困難:[1], 警察官:[4, 3], 黒板:[0], 新年:[1], 速い:[2], 義理:[2], 自動車:[2, 0], 汚い:[3], 香り:[0], 解説:[0], 食べ物:[3, 2], 意欲:[1], 商品:[1], 実感:[0], 火傷:[0], 品詞:[0], 形容動詞:[5], 屋上:[0], 不幸:[2], 進撃:[0], 強制:[0], 理解:[1], 分解:[0], 獲物:[0], 資料:[1], 香水:[0], 保守主義:[3], 混じる:[2], 省く:[2], 無税:[1], 固有名詞:[4], 国際:[0], 宮:[0], 臨海:[0], 断る:[3], 条約:[0], 女権:[0], 大勢:[3], 寝る:[0], 援助:[1], 誕生:[0], 売り上げ:[0], 提出:[0], 指示:[1], 脱ぐ:[1], 脱税:[0], 過ぎる:[2], 見詰める:[0, 3], 観る:[1], 大作:[0], 委員会:[2, 0], 新幹線:[3], 現れる:[4], 表現:[3], 現実:[0], 看護師:[3], 契機:[1], 負担:[0], 子供:[0], 良質:[0], 輸出:[0], 記述:[0], 多額:[0], 融資:[1, 0], 分離:[0], 牛肉:[0], 警視庁:[3], 応援団:[3], 株式:[2], 気候:[0], 怪物:[0], 掛ける:[2], 毛虫:[0, 3], 冷凍庫:[3], 星占い:[3, 4], 満点:[3], 豚:[0], 程度:[0, 1], 全景:[0], 微か:[1], 助ける:[3], 再び:[0], 突く:[0, 1], 触れる:[0], 討論:[1], 障害:[0], 修士:[1], 抜ける:[0], 幼い:[3], 清潔:[0], 衆議院:[3], 逆説:[0], 登録:[0], 家政婦:[2], 近い:[2], 凍る:[0], 撃つ:[1], 精神:[1], 離れる:[3], 病床:[0], 言葉:[3], 料理人:[0], 入門:[0], 施行:[0], 編集:[0], 距離:[1], 生涯:[1], 字典:[0], 下町:[0], 辞書:[1], 関係:[0], 取る:[1], 弁当:[3], 急行:[0], 残品:[0, 1], 不治:[1, 2], 毎月:[0], 国賓:[0], 浴びる:[0], 日光浴:[3], 写真:[0], 地面:[1], 絶景:[0], 仕事:[0], 薬:[0], 給与:[1], 混ぜる:[2], 嘆く:[2], 普通:[0], 欠席:[0], 干天:[0, 3], 火事:[1], 鼻歌:[0], 編集者:[3], 図:[0], 光栄:[0], 編む:[1], 感嘆符:[3], 予報:[0], 塩味:[2, 0], 栄える:[3], 取り分け:[0], 情報:[0], 証明書:[5, 0], 外務大臣:[4], 恵む:[0], 里心:[3], 大阪弁:[0], 汽車:[2], 許す:[2], 毎年:[0], 地下街:[2], 掲げる:[0], 話す:[2], 三:[0], 及ぼす:[3, 0], 丸い:[0, 2], 羽:[0], 廊下:[0], 監視:[0], 湯豆腐:[2], 繰る:[1], 抑制:[0], 下:[0], 遠距離:[3], 鑑定:[0], 二つ:[3], 巣立ち:[0, 3], 二人:[3], 及び:[0, 1], 脂肪:[0], 詰まる:[2], 金:[1], 母:[1], 化ける:[2], 中々:[0], 掃除:[0], 短距離:[3], 人口:[0], 除く:[0], 本社:[1], 六月:[4], 女:[3], 川:[2], 大きさ:[0], 中:[1], 排除:[1], 役場:[3], 五十:[2], 出す:[1], 何日:[1], 十六:[4], 入籍:[0], 四:[1], 外来:[0], 右:[0], 子犬:[0], 秀でる:[3], 尋ねる:[3], 君:[0], 体内:[1], 上手:[3], 天:[1], 下手:[2], 文:[1], 大声:[3], 木:[1], 生:[1], 一斉に:[0], 田:[1], 人生:[1], 火山:[1], 却下:[1], 水:[0], 正す:[2], 滅びる:[3, 0], 幾何学:[2], 掛かる:[2], 兄:[1], 必需品:[0], 久しい:[3], 分かる:[2], 少し:[2], 来月:[1], 先月:[1], 発表:[0], 泥棒:[0], 太い:[2], 高齢者:[3], 掃く:[1], 自分:[0], 記事:[1], 逆らう:[3], 携帯電話:[5], 止める:[0], 泥:[2], 不正:[0], 世:[1, 0], 来る:[1], 空車:[0], 休み:[3], 妊婦:[1], 近郊:[0], 乱戦:[0], 仮定:[0], 気分:[1], 一文字:[0, 3], 去年:[1], 本当:[0], 月刊:[0], 先生:[3], 氷:[0], 一気:[1], 年内:[1], 一打:[2], 日刊:[0], 打つ:[1], 驚嘆:[0], 釈明:[0], 見方:[3, 2], 小皿:[0, 1], 大会:[0], 花火:[1], 男:[3], 伴う:[3], 車:[0], 処置:[1], 自在:[0], 侵攻:[0], 米:[2], 代える:[0], 経路:[1], 救急車:[3], 光:[3], 何回:[1], 体力:[1], 日光:[1], 記載:[0], 七:[1], 救う:[0], 三人:[3], 女子:[1], 女神:[1], 散歩:[0], 夕べ:[3, 0], 子牛:[0], 併合:[0], 正解:[0], 日:[0], 北:[0, 2], 皮:[2], 竹:[0], アメリカ人:[4], 探偵:[0], 休日:[0], 苦い:[2], 英国:[0], 二世:[1], 切迫:[0], 山脈:[0], 写す:[2], 体重:[0], 学年:[0], 月光:[0], 今月:[0], 音:[2], 代用:[0], 王女:[1], 今晩は:[5], 土:[2], 半:[1], 村人:[0], 野菜:[0], 主人:[1], 探す:[0], 中止:[0], 肉屋:[2], 却って:[1], 少年:[0], 字:[1], 似る:[0], 四角:[3], 対談:[0], 市立:[1], 学生:[0], 決定:[0], 均等:[0], 五日:[3, 0], 配慮:[1], 必至:[0], 薦める:[0], 太字:[0], 休止:[0], 金玉:[3, 0], 有名:[0], 代わり:[0], 年下:[0], 休む:[2], 均整:[0], 出発:[0], 心:[3, 2], 発見:[0], 太る:[2], 二重:[0], 逃す:[2], 体:[0], 都会:[0], 不機嫌:[2], 当たる:[0], 正しい:[3], 楽勝:[0], 小さい:[3], 大切:[0], 中央:[3, 0], 行う:[0], 重要:[0], 内偵:[0], 考慮:[1], 至上:[0], 稼ぐ:[2], 街道:[0], 魚屋:[0], 電飾:[0], 暖房:[0], 誠:[0], 矛盾:[0], 雑煮:[0], 陛下:[1], 風呂場:[3], 幸福:[0], 不人気:[2], 発売:[0], 本気:[0], 会う:[1], 耳打ち:[0, 3], 先回り:[3, 0], 生える:[2], 今更:[0, 1], 作用:[1], 工作:[0], 見る:[1], 作る:[2], 表:[3], 仏像:[0], 選択:[0], 生む:[0], 分ける:[2], 納入:[0], 家具:[1], 売り手:[0], 漏らす:[2], 売り切れ:[0], 惨敗:[0], 客室:[0], 出版社:[3], 照り焼き:[0], 兄弟:[1], 描く:[1], 誠実:[0], 参る:[1], 起床:[0], 矛先:[0], 粘着:[0], 煮物:[0], 家事:[1], 天気予報:[4], 冷える:[2], 称える:[0, 3], 郷里:[1], 贈収賄:[3], 古来:[1], 早口:[2], 空:[1], 公社:[1], 何度:[1], 毎回:[0], 入社:[0], 男の子:[3], 自立:[0], 水色:[0], 考え:[3], 色々:[0], 考え方:[5, 6], 和食:[0], 言う:[0], 行き:[0], 三角:[1], 西:[0], 走行:[0], 大騒ぎ:[3], 矛:[1], 躍如:[1], 覆る:[3], 里:[0], 委託:[0], 肌色:[0], 青い:[2], 交わる:[3], 仮名:[0], 青年:[0], 不安:[0], 全く:[0], 交ぜる:[2], 全力:[0], 惨状:[0], 安全:[0], 地下:[1, 2], 幸せ:[0], 夏:[2], 志:[0], 託す:[2], 縄跳び:[3, 4], 棋士:[1, 2], 侵入:[0], 鳥肌:[0], 必要:[0], 桜色:[0], 信託:[0], 駆け込む:[0, 3], 何年:[1], 駆け出す:[3, 0], 精神的:[0], 貨物:[1], 新しい:[4], 次回:[1, 0], 搾乳:[0], 国:[0], 外国:[0], 外国人:[4], 今夜:[1], 妹:[4], 苦しい:[3], 賄う:[3], 駆け回る:[0, 4], 布巾:[2], 陶芸:[0], 破産:[0], 死体:[0], 中学生:[3, 4], 将棋:[0], 犠飛:[1], 鐘:[0], 帽子:[0], 扇ぐ:[2], 早く:[1], 永遠:[0], 弾く:[0], 取れる:[2], 喪失:[0], 警鐘:[0], 紙幣:[1], 隔離:[1, 0], 別れる:[3], 社内:[1], 相手:[3], 弱々しい:[5], 誕生日:[3], 倫理学:[3], 思う:[2], 不明:[0], 狩人:[1, 2], 永久:[0], 言葉遣い:[4], 狙う:[0], 克服:[0], 貨幣価値:[4], 俗語:[0], 割り勘:[0], 整理:[1], 掲示板:[0], 喪:[0, 1], 脚本:[0], 恨む:[2], 俗:[0], 可哀想:[4], 宿:[1], 己:[0], 夏休み:[3], 出来上がる:[0, 4], 祖父:[1], 物真似:[0], 渋滞:[0], 床:[0], 住民:[0, 3], 東方:[0], 弱点:[3], 直す:[2], 生活:[0], 弟:[4], 付ける:[2], 必勝:[0], 倫理的:[0], 成績:[0], 党員:[0], 平日:[0], 寝床:[0], 憎む:[2], 邦人:[0], 自衛:[0], 原子爆弾:[4], 括る:[0], 天井:[0], 憩い:[0], 妥協:[0], 装う:[3, 0], 全て:[1], 以外:[1], 泳ぎ:[3], 衛生:[0], 邦訳:[0], 一括:[0], 扇子:[0], 家:[2], 同時:[0, 1], 名前:[0], 茶屋:[0], 教室:[0], 戦争:[0], 一時:[2], 必ず:[0], 工場:[3], 氏:[1], 複数:[3], 未だ:[0], 理由:[0], 社会:[1], 際:[2], 紙:[2], 海魚:[1], 通る:[1], 交通:[0], 作者:[1], 三角形:[3, 4], 複写:[0], 隆起:[1, 0], 旧暦:[0], 挿絵:[0, 2], 住む:[1], 挑む:[2], 壁:[0], 眺望:[0], 挿入:[0], 推奨:[0], 皇太子妃:[5], 雑費:[0], 年次:[1], 助力:[0, 1], 酸っぱい:[3], 片仮名:[3], 揚げる:[0], 全裸:[1, 0], 殺菌:[0], 水中:[0], 合う:[1], 和室:[0], 本物:[0], 場合:[0], 反対:[0], 会話:[0], 持つ:[1], 片道:[0], 握る:[0], 疲れる:[3], 掌:[2, 1], 安売り:[0], 酸素:[1], 出所:[0], 後ろ:[0], 思い出:[0], 役:[2], 思い出す:[4, 0], 銭湯:[1], 握手:[1], 電卓:[0], 炊く:[0], 劣悪:[0], 傷:[0], 出血:[0], 食卓:[0], 自炊:[0], 不明瞭:[2], 騎馬:[1], 迷彩:[0], 動揺:[0], 共産党:[0], 御免:[0], 一生懸命:[5], 卓球:[0], 炊事:[0], 勘違い:[3], 革命:[0], 曲げる:[0], 事:[2], 厳禁:[0], 免除:[1], 芸人:[0], 爽やか:[2], 悪賢い:[5], 農業:[1], 受験:[0], 島:[2], 両方:[3, 0], 密告:[0], 勧誘:[0], 国柄:[0], 割り箸:[0, 3], 決める:[0], 疑問:[0], 決:[1], 万:[1], 明るい:[0, 3], 全身:[0], 自決:[0], 今度:[1], 埋める:[0], 茶色:[0], 感染:[0], 人柄:[0], 陰:[1], 胴:[1], 鬱陶しい:[5], 初級:[0], 伝染病:[0], 奪う:[2, 0], 一泊:[0], 脅す:[0, 2], 連邦:[0], 果たして:[2], 国境:[0], 大文字:[0], 人間:[0], 長さ:[1], 空間:[0], 実力:[0], 受胎:[0], 会:[1], 工事:[1], 回す:[0], 返事:[3], 付く:[1, 2], 安い:[2], 和服:[0], 道具:[3], 受ける:[2], 勝つ:[1], 汚れる:[0], 拒む:[2], 脅迫:[0], 巧い:[2], 泊まる:[0], 社長:[0], 空気:[1], 映る:[2], 欲しい:[2], 悪霊:[0], 部屋:[2], 涼む:[2], 始まる:[0], 甲:[1], 机:[0], 角度:[1], 円滑:[0], 肝臓:[0], 霊感:[0], 蓄える:[4, 3], 下駄:[0], 始める:[0], 方言:[3, 0], 簡単:[0], 譲る:[0], 潟:[2], 湿る:[0], 弱虫:[2], 小学校:[3], 名物:[1], 気持ち:[0], 世界:[1], 見付ける:[0], 線:[1], 要点:[3], 負ける:[0], 美しい:[4], 訳:[1], 移譲:[0], 狂う:[2], 蚊:[0], 訂正:[0], 最近:[0], 唐突:[0], 方向:[0], 重い:[0], 高さ:[1], 化かす:[2], 猿真似:[0], 謙譲語:[0], 濁る:[2], 歌う:[0], 地:[1], 楽しみ:[3, 4], 散らかす:[0], 最高:[0], 東:[0, 3], 終電:[0], 終了:[0], 苦手:[0, 3], 死:[1], 落ち葉:[1], 話し方:[4, 5], 青葉:[1], 物語:[3], 活気:[0], 名曲:[0], 起こす:[2], 起こる:[2], 貨物船:[0], 活躍:[0], 項目:[0], 負け犬:[0], 躍進:[0], 焦げる:[2], 蚊帳:[0], 宮廷:[0], 名:[0], 壮年:[0], 転送:[0], 以下:[1], 自転車:[2, 0], 華々しい:[5], 早速:[0], 軽い:[0], 見返す:[0, 2], 集まる:[3], 病院:[0], 開ける:[0], 間に合う:[3], 酒飲み:[3, 4], 乗り場:[0], 競争:[0], 一位:[0], 近く:[2, 1], 乗せる:[0], 便利:[1], 便所:[3], 育つ:[2], 上級:[0], 墓場:[3], 握り:[0], 労働:[0], 窓口:[2], 躍動:[0], 叫び声:[4], 名簿:[0], 遊戯:[1], 交通網:[3], 走る:[2], 正直:[3, 4], 公共:[0], 部室:[0], 務める:[3], 放れる:[3], 意外:[0, 1], 宣伝:[0], 事項:[1], 新芽:[0], 別々:[0], 成功:[0], 別に:[0], 指す:[1], 宣言:[3], 墨絵:[0], 友好:[0], 好き:[2], 完成:[0], 成る:[1], 拾う:[0], 待合室:[3], 意味:[1], 長い:[2], 忠告:[0], 平穏:[0], 恥辱:[0], 漫画:[0], 肝:[2], 漠然:[0], 落ち:[2], 放す:[2], 水星:[0], 親指:[0], 神:[1], 競う:[2], 操る:[3], 特に:[1], 秒:[1], 体操:[0], 奥さん:[1], 芝生:[0], 次:[2], 軌道:[0], 演技:[1], 孤独:[0], 中級:[0], 贈り物:[0], 悪魔:[1], 歳暮:[0], 迅速:[0], 溶かす:[2], 銘柄:[0], 洞穴:[0], 律動的:[0], 意地悪:[3, 2], 勉強:[0], 動物:[0], 全員:[0], 商人:[1], 寒い:[2], 庭:[0], 息子:[0], 悪人:[0], 灰色:[0], 葬儀:[1], 暴露:[1], 魔女:[1], 寮:[1], 騎士:[1, 2], 軌跡:[0], 興奮:[0], 最悪:[0], 旅:[2], 旅行:[0], 家族:[1], 直行:[0], 昼休み:[3], 親類:[0], 悪口:[2], 時期:[1], 大根:[0], 屋根:[1], 根気:[0], 植物:[2], 食料品:[0], 消す:[0], 未熟:[0, 1], 包み紙:[3], 珍しい:[4], 寮生:[0], 騎手:[1, 2], 水深:[0], 深い:[2], 異なる:[3], 贈賄:[0], 悪趣味:[3], 騎兵:[0], 仰ぐ:[2], 周期:[1], 湯気:[1], 茶の湯:[0], 野球:[0], 球:[2], 転ぶ:[0], 東北:[0], 愛情:[0], 天皇:[3], 襲う:[0, 2], 寧ろ:[1], 彩る:[3], 色彩:[0], 把握:[0], 伯:[1], 教科書:[3], 原稿:[0], 着る:[0], 着物:[0], 年上:[0], 第一:[1], 通す:[1], 砂糖:[2], 襲撃:[0], 飲み会:[2, 0], 情け:[1, 3], 感想:[0], 納める:[3], 空襲:[0], 威張る:[2], 丁寧:[1], 飾り:[0], 楽器:[0], 収納:[0], 斬新:[0], 車椅子:[3], 彩り:[0, 4], 配偶者:[3], 欠かす:[0], 趣:[0], 画像:[0], 右利き:[0], 肺:[0], 暗い:[0], 戸籍:[0], 斬る:[1], 憶測:[0], お姉さん:[2], 問題:[0], 器:[0], 食器:[0], 力士:[1, 0], 大好き:[1], 感情:[0], 戦う:[0], 料金:[1], 映画:[1, 0], 肺病:[0], 要る:[0], 露骨:[0], 椅子:[0], 静粛:[0], 一歩:[1], 皆様:[2], 目標:[0], 自殺:[0], 自然:[0], 熱い:[2], 熱心:[1, 3], 皆さん:[2], 育てる:[3], 詩:[0], 詩人:[0], 課長:[0], 選手:[1], 水銀:[0], 銀行:[0], 著しい:[5], 賃貸:[0], 露店:[0], 歳月:[1], 古墳:[0], 海外:[1], 一例:[0], 協会:[0], 自動:[0], 諸君:[1], 一周:[0], 囲む:[0], 固い:[0, 2], 家賃:[1], 牧野:[1], 万歳:[3], 賢明:[0], 良好:[0], 四季:[2, 1], 残念:[3], 求婚:[0], 人性:[0], 議長:[1], 辞典:[0], 材料:[3], 残る:[2], 求める:[3], 求人:[0], 流れる:[3], 山登り:[3], 大仏:[0], 心臓:[0], 反射:[0], 安心:[0], 祈願:[1], 私大:[0], 落ち着く:[0], 骨:[2], 骨格:[0], 自信:[0], 返す:[1], 返信:[0], 引っ越す:[3], 牧場:[0], 歳入:[0], 輝く:[3], 恒常:[0], 単に:[1], 単語:[0], 上司:[1], 変事:[1], 夫:[0], 好む:[2], 帰る:[1], 毎晩:[1, 0], 晴れる:[2], 羊:[0], 食中毒:[3], 文法:[0], 泣く:[0], 新築:[0], 世紀:[1], 英和:[0], 指輪:[0], 係わる:[3], 保持:[1], 保つ:[2], 古典的:[0], 事典:[0], 冗談:[3], 待機:[1, 0], 新品:[0], 喜ぶ:[3], 飼い主:[2, 1], 守る:[2], 政府:[1], 急死:[0], 使う:[0], 店:[2], 全治:[1], 曜日:[0], 留守:[1], 事実:[1], 世の中:[2], 留学:[0], 自動的:[0], 図書館:[2], 燃料:[3], 芸術家:[0], 原因:[0], 使い捨て:[0], 即興:[0], 涼しい:[3], 大麻:[1], 南:[0], 漢字:[0], 辞める:[0], 内側:[0], 飛び込み自殺:[5], 紅:[1], 権威:[1], 鍵:[2], 世辞:[0], 東側:[0], 兵員:[0], 当たり:[0], 目次:[0], 内因:[0], 常に:[1], 常識:[0], 飾る:[0], 城:[0], 干す:[1], 幻:[0], 建築家:[0], 建物:[2, 3], 実:[2], 正座:[0], 恋:[1], 敗れる:[3], 失敗:[0], 敗者:[1], 無休:[0], 無事:[0], 無料:[0], 紀元前:[4, 2], 細い:[2], 薬用:[0], 虚栄心:[2], 貴い:[3], 純粋:[0], 乗り物:[0], 封建主義:[5], 零す:[2], 自覚:[0], 図説:[0], 鼻血:[0], 取り決め:[0], 柔和:[0], 楓:[1], 今年:[0], 可愛い:[3], 許可:[1], 告白:[0], 告げる:[0], 喫茶店:[3, 0], 留守番:[0], 座禅:[0], 銀座:[0], 駅弁:[0], 金曜日:[3], 月曜日:[3], 火曜日:[2], 書く:[1], 下書き:[0], 書き直す:[4, 0], 洗う:[0], 洗練:[0], 焼ける:[0], 煙:[0], 祈る:[2], 武士:[1], 禁煙:[0], 貴族:[1], 奴隷:[0], 見逃す:[0, 3], 封筒:[0], 碁:[0, 1], 悔しい:[3], 渡す:[0], 禁止:[0], 笛:[0], 等しい:[3], 手荷物:[2], 試す:[2], 友達:[0], 敵:[0], 伝達:[0], 人類:[1], 平静:[0], 書類:[0], 種類:[1], 実験:[0], 乱れる:[3], 算数:[3], 評論:[0], 乱交:[0], 参加:[0], 宇宙:[1], 警官:[0], 履歴書:[4, 0], 履く:[0], 忙しい:[4], 若布:[1, 2], 布団:[0], 生徒:[1], 説得:[0], 信徒:[1], 得る:[1], 得意:[2, 0], 恋人:[0], 吐く:[1], 損害:[0], 駐在:[0], 岳:[2], 碁盤:[0], 遂げる:[0, 2], 故:[2], 昆布:[1], 顧問:[1], 首班:[0], 縦横:[1], 尽きる:[2], 乱暴:[0], 梅干:[0], 比べる:[0], 比例:[0], 混ざる:[2], 減る:[0], 若々しい:[5], 歌詞:[1], 財閥:[0], 磁石:[1], 顧みる:[4], 慰める:[4], 水泡:[0], 班長:[1], 倒れる:[3], 貸し切り:[0], 連続:[0], 心配:[0], 紅茶:[0], 指揮:[2, 1], 勤める:[3], 回顧録:[3], 唱える:[3], 懇話:[0], 努力:[1], 斜面:[1, 0], 指圧:[0], 余計:[0], 倒す:[2], 不可分:[2], 圧力:[2], 夢:[2], 妻:[1], 嫌い:[0], 災害:[0], 震災:[0], 胸焼け:[0, 4], 論理:[1], 放射:[0], 駐車場:[0], 懲りる:[2], 産む:[0], 穴子:[0], 犯罪:[0], 摩擦:[0], 拝む:[2], 斜体:[0], 擦れる:[2], 音訓:[0], 理論:[1], 不思議:[0], 親友:[0], 自薦:[0], 駆ける:[2], 口癖:[0], 被る:[2], 入学試験:[6, 5], 乱す:[2], 任意:[1, 0], 判子:[3], 集金:[0], 委員:[1], 正義:[1], 宇宙船:[0], 捕える:[3], 歌唱:[0], 旨:[2, 1], 鍛錬:[1], 殴る:[2], 出来る:[2], 発音:[0], 改まる:[4], 無敵:[0, 1], 沿う:[0, 1], 腐食:[0], 孝行:[1], 要旨:[1], 錬金術:[3], 殴り合い:[0], 集中:[0], 済む:[1], 反省:[0], 税金:[0], 総合:[0], 解ける:[2], 確認:[0], 責任:[0], 投資:[0, 1], 食べる:[2], 価:[0], 電源:[0, 3], 物価:[0], 不孝:[2], 親孝行:[3], 安値:[2, 0], 調子:[0], 副業:[0], 勢力:[1], 各々:[2], 県営:[0], 案内:[3], 機会:[2, 0], 戯曲:[0], 赤ん坊:[0], 領域:[0], 寝不足:[0, 2], 一応:[0], 反応:[0], 応援:[0], 状態:[0], 策:[2, 1], 大統領:[3], 置く:[0], 藤:[0], 被害者:[2], 観客:[0], 乳首:[2, 1], 備える:[3], 準備:[1], 反則:[0], 法則:[0], 歌劇:[1], 承る:[5], 割る:[0], 開発:[0], 増やす:[2], 住宅:[0], 導く:[3], 教師:[1], 律動:[0], 指導:[0], 施設:[1, 2], 断つ:[1], 経済的:[0], 現場:[0], 職場:[0, 3], 職員:[2], 有職:[1, 0], 辞職:[0], 裁く:[2], 解く:[1], 革:[2], 型:[2], 時差:[1], 都庁:[1], 穂:[1], 刻む:[0], 巡る:[0], 柔らかい:[4], 帝政:[0], 収穫:[0], 自動販売機:[6], 駄目:[2], 瞬間:[0], 担ぐ:[2], 武器:[1], 時刻表:[0], 深刻:[0], 巡査:[0, 1], 捕獲:[0], 名誉:[1], 沈む:[0], 団扇:[2], 歩く:[2], 訓戒:[0], 沈黙:[0], 誇大:[0], 駒:[1, 0], 狭い:[2], 購買:[0], 川柳:[1, 3], 祝う:[2], 排出:[0], 透ける:[0], 琴:[1], 誇る:[2], 阻む:[2], 誓い:[0], 中指:[2], 祝日:[0], 阻止:[1], 大丈夫:[3], 敏感:[0], 年輩:[0], 対策:[0], 管理:[1], 規準:[0], 初めて:[2], 対象:[0], 現象:[0], 裏切り者:[0, 6], アメリカ製:[0], 触角:[0], 載る:[0], 輸血:[0], 上述:[0], 述べる:[2], 違い:[0], 半額:[0], 定額:[0], 与える:[0], 強調:[0], 所属:[0], 巻く:[0], 頑張る:[3], 撮影:[0], 捕まる:[0], 捜査:[1], 景況:[0], 足し算:[2], 替わる:[0], 閉まる:[2], 補う:[3], 土俵際:[0], 頑丈:[0], 喜劇:[1], 文化:[1], 鋭い:[3], 構う:[2], 響く:[2], 殿堂:[0], 泊める:[0], 綿:[2], 進化:[1], 礎:[0], 敷金:[2], 屋敷:[3], 滑り台:[3], 架設:[0], 基礎:[1, 2], 利潤:[0], 同音異義語:[6], 双眼鏡:[0], 顔付き:[0], 告訴:[1], 訴訟:[0], 逮捕:[1], 顔:[0], 影響:[0], 鮮やか:[2], 再度:[1], 繁茂:[1], 群れる:[2], 再来週:[0], 刺激:[0], 第一印象:[5], 創立:[0], 占い:[0, 3], 人差し指:[4], 我:[1], 悩む:[2], 振る:[0], 氏名:[1], 不振:[0], 直接:[0], 直接的:[0], 間接:[0], 面接:[0], 株式市場:[5], 一番目:[5, 0], 河童:[0], 気象庁:[2], 自販機:[2], 氷河:[1], 独立:[0], 外来語:[0], 貯える:[4, 3], 載せる:[0], 過ごす:[2], 針金:[0], 関心:[0], 隠れる:[3], 就職:[0], 値段:[0], 怒る:[2], 基本的:[0], 惑う:[2], 招く:[2], 招き猫:[4], 昇る:[0], 迷惑:[1], 書架:[1], 昇進:[0], 両替:[0], 取り替える:[0, 4], 着替え:[0], 究極:[0], 極める:[3], 構え:[2, 3], 大規模:[3], 濃い:[1], 大学院:[4], 無我夢中:[1], 頻りに:[0], 褒美:[0], 焦る:[2], 眺め:[3], 刈り取る:[3], 間隔:[0], 掛け算:[2], 不眠症:[0], 主婦:[1], 殖える:[2], 焦がす:[2], 淡水:[0], 工業:[1], 泌尿器:[2], 痛い:[2], 中途半端:[4], 減給:[0], 赤ちゃん:[1], 薄める:[0, 3], 紛れ:[1], 痛恨:[0], 百:[2], 向ける:[0], 背後:[1], 華道:[1], 人々:[2], 理屈:[0], 二日:[0], 態と:[1], 眼鏡:[1], 諮問:[0], 部分:[1], 逃がす:[2], 日本酒:[0], 没落:[0], 浜辺:[0, 3], 不味い:[2], 通う:[0], 寄る:[0], 用意:[1], 明日:[3], 路地:[1], 言語:[1], 病む:[1], 麦粉:[3], 最後:[1], 病人:[0], 支度:[0], 歌:[2], 気付く:[2], 会員:[0], 武装:[0], 一階:[0], 濁す:[2], 猟:[1], 無し:[1], 白熊:[0], 勇む:[2], 警告:[0], 木綿:[0], 不足:[0], 潔い:[4], 猟師:[1], 更生:[0], 開業:[0], 大幅:[0], 衣服:[1], 大人しい:[4], 海王星:[0, 3], 緊張:[0], 評判:[0], 記念日:[2], 連日:[0], 上演:[0], 控え:[3, 2], 欠乏:[0], 脊髄:[2, 0], 慰謝料:[2], 広告:[0], 連れる:[0], 幕府:[1], 見渡す:[0, 3], 伯父:[0], 何故:[1], 群集:[0], 間:[0], 混血:[0], 楽天主義:[5], 幸い:[0], 沢山:[3], 収める:[3], 違反:[0], 弾力:[0, 1], 本来:[1], 手首:[1], 二十日:[0], 草地:[0], 見極める:[4, 0], 考古学:[3], 船員:[0], 動物園:[4], 発祥:[0], 人工:[0], 変わる:[0], 教え:[0], 喜び:[0, 3], 従順:[0], 寄与:[1], 居間:[2], 茎:[2], 無言:[0], 作業:[1], 化繊:[0], 学歴:[0], 伝:[2], 台風:[3], 秩序:[2, 1], 抜き出す:[3], 目医者:[1], 衰える:[4, 3], 八日:[0], 生物学:[4], 活動:[0], 金星:[0], 予め:[0], 船体:[0], 崇拝:[0], 理性:[1], 固まる:[0], 小柄:[0], 欠伸:[0], 利く:[0], 返る:[1], 屈む:[0], 割り算:[2], 輸送:[0], 間違える:[4, 3], 舞:[0], 債権:[0], 捜す:[0], 綺麗:[1], 耐熱:[0], 驚く:[3], 荷物:[1], 擁する:[3], 蛮行:[0], 一生:[0], 付近:[2, 1], 入力:[0, 1], 得体:[0], 知恵:[2], 入院:[0], 回転:[0], 価格:[0, 1], 快楽:[1, 0], 恐らく:[2], 場面:[0, 1], 文字通り:[3], 九日:[4], 落雷:[0], 寄付:[1], 関連:[0], 簡易:[1, 0], 貴重:[0], 大いに:[1], 国王:[3], 完結:[0], 当たり前:[0], 灯る:[2, 0], 励ます:[3], 劣化:[0], 土星:[0], 筆:[0], 大空:[3], 禅寺:[0], 心得:[3, 4], 光る:[2], 口調:[0], 行動:[0], 想定:[0], 幸運:[0], 新た:[1], 放つ:[2], 新陳代謝:[5], 待合:[0], 西洋:[1], 愛する:[3], 相変わらず:[0], 子守歌:[3], 議員:[1], 避ける:[2], 蓮根:[0], 透き通る:[3], 温床:[0], 伝説:[0], 堕胎:[0], 膜:[2], 尾:[1], 帆柱:[2], 家庭教師:[4], 栓抜き:[3, 4], 茨:[0], 大胆:[3], 貞操:[0], 蝶:[1], 誤り:[3, 0], 煩い:[3], 歌謡:[0], 擁立:[0], 疾走:[0], 盲腸:[1], 顕在:[0], 大腸菌:[0], 愚:[1, 0], 危ない:[0, 3], 貫通:[0], 崩す:[2], 居眠り:[3], 一日:[4], 部首:[1], 運動会:[3], 貫徹:[0], 従兄弟:[2], 銃殺:[0], 演芸:[0], 夜:[1], 恐れ:[3], 披露:[1], 降ろす:[2], 午前:[1], 引き算:[2], 姉:[0], 父:[2, 1], 少女:[1], 平気:[0], 手頃:[0], 絶叫:[0], 蓮花:[0], 活用形:[0], 連中:[0], 建前:[0], 唯:[1], 無邪気:[1], 頻発:[0], 四国:[2, 1], 初歩:[1], 悲しみ:[0, 3], 期間:[2, 1], 表す:[3], 快適:[0], 指差す:[3], 高等:[0], 限度:[1], ハート形:[0], 買い物:[0], 呉服:[0], 点ける:[2], 人形:[0], 最後尾:[3], 飾り気:[0], 向く:[0], 農場:[0, 3], 丁度:[0], 学期:[0], 流行:[0], 下品:[2], 面白い:[4], 基本:[0], 別:[0], 栓:[1], 没後:[1, 0], 辺り:[1], 状況:[0], 官営:[0], 立派:[0], 条件:[3], 入所:[0], 当てる:[0], 信用:[0], 引退:[0], 時代:[0], 地中:[0], 切腹:[0], 来賓:[0], 生まれ:[0], 外交:[0], 小声:[0], 一体:[0], 本質:[0], 活用:[0], 一覧:[0], 今日は:[5], 役目:[3], 顔文字:[0], 昔話:[4], 具合:[0], 植える:[0], 王様:[0], 遭遇:[0], 待遇:[0], 近代的:[0], 整える:[4, 3], 捕鯨:[0], お父さん:[2], 町民:[0], 左右:[1], 折れる:[2], 真髄:[0, 1], 郵便番号:[5], 腰抜け:[0], 大気:[1], 対等:[0], 身:[0], 文学:[1], 直る:[2], 果てる:[2], 三百:[1], 近道:[2], 嫌悪:[1], 五百:[3], 沈める:[0], 憂き目:[0, 1], 対応:[0], 横:[0], 知る:[0], 心得る:[4], 迫る:[2], 葬る:[3], 思わず:[2], 添える:[0, 2], 治す:[2], 科目:[0], 歌手:[1], 土曜日:[2], 跡:[1], 用心棒:[3], 性病:[0], 一代:[2], 狭める:[3], 斬殺:[0], 生物:[1, 0], 一翼:[0], 揺らぐ:[0, 2], 散らし:[0], 優遇:[0], 暮れる:[0], 馬鹿馬鹿しい:[5], 両翼:[0], 埋まる:[0], 写る:[2], 濃度:[1], 盆栽:[0], 新聞:[0], 上る:[0], 万年筆:[3], 手渡す:[3, 0], 台所:[0], 今朝:[1], 渋々:[1, 0], 意図的:[0], 厳しい:[3], 翌日:[0], 挟まる:[3], 据える:[0], 立ち飲み:[0], 港:[0], 調べる:[3], 搭乗:[0], 搭載:[0], 疾病:[0], 翌朝:[0], 神様:[1], 酷評:[0], 老舗:[0], 一遍に:[3], 筒:[2, 0], 軒:[0], 翌年:[0], 曙:[0], 文化祭:[3], 音痴:[1], 覆う:[0, 2], 貞節:[0], 虜:[3, 0], 左遷:[0], 官邸:[0], 婚姻:[0], 露:[1, 2], 覇気:[1], 庶民的:[0], 一旦:[0], 赴任:[0], 不貞:[0], 遷都:[1], 罷免:[0], 晴れ:[2], 依然:[0], 見事:[1], 藍:[1], 先日:[0], 柔軟:[0], 軟禁:[0], 紫色:[0], 枯れ木:[0], 胞子:[1], 変遷:[0], 治安:[0, 1], 冠:[1], 留学生:[3, 4], 枯らす:[0], 末:[0], 酪農:[0], 甲斐性:[3, 0], 師匠:[1, 2], 大人:[0], 車両:[0], 一昨日:[3], 逃げる:[2], 値:[0], 四月:[3], 一人:[2], 公邸:[0], 旦那:[0], 禁じる:[0, 3], 嘉日:[1], 閑散:[0], 塊:[0], 雌花:[1], 大きい:[3], 邸宅:[0], 二月:[3], 稿料:[1, 3], 高等学校:[5], 聞く:[0], 即効:[0], 煮る:[0], 郊外:[1], 大した:[1], 沸かす:[0], 郡:[1], 沸騰:[0], 自浄:[0], 浄化:[1, 0], 弦:[2, 1], 電磁場:[3], 八:[2], 殊勲:[2, 0], 有り難う:[2], 注釈:[0], 輪郭:[0], 浄土:[1], 怠け者:[0, 5], 摂取:[1], 唄:[2], 浄水:[0], 忍ぶ:[2, 0], 現に:[1], 恭しい:[5], 弦楽:[0], 不浄:[0], 会釈:[1], 解釈:[1], 隅:[1], 満悦:[0], 浮世絵:[0, 3], 片隅:[3, 0], 八つ:[3], 四隅:[1], 愚か:[1], 両腕:[0], 穀類:[2], 坑道:[0], 怪しい:[0, 3], 話:[3], 隅々:[2, 1], 華美:[1], 清浄:[0], 叙勲:[0], 搾る:[2], 搾取:[1], 白旗:[0], 摂氏:[1], 右腕:[0], 洗浄:[0], 頂く:[0], 山頂:[0], 智:[1], 解剖学:[3], 鉄人:[0], 鎮圧:[0], 襟:[2], 胃:[0], 渦巻き:[2], 西瓜:[0], 不倫:[0], 倫理:[1], 摂理:[1], 弾劾:[0], 主語:[1], 何故なら:[1], 山:[2], 柴犬:[0], 示す:[2], 尻尾:[3], 湧く:[0], 勲章:[0], 焼く:[0], 命令:[0], 鳴き声:[3, 0], 進む:[0], 九:[1], 遊び:[0], 戦い:[0], 要求:[0], 不良:[0], 九つ:[2], 痴漢:[0], 卸:[3, 1], 親分:[1, 2], 偏る:[3], 偏見:[0], 裁縫:[0], 錯乱:[0], 鳴く:[0], 卸す:[2], 一:[2], 異常:[0], 柴:[0], 倒錯:[0], 錯覚:[0], 傷む:[2], 交錯:[0], 一つ:[2], 又:[0], 甲乙:[1], 集める:[3], 丘陵:[0], 紡ぐ:[2, 0], 卸値:[3, 0], 卸売:[0, 3], 偏狭:[0], 恒星:[0], 長唄:[0], 石油:[0], 哺乳瓶:[2], 支払い:[0], 淑女:[2, 1], 陳列:[0], 放浪:[0], 偉人:[0], 瓶:[1], 偉大:[0], 浪人:[0], 飽和:[0], 人:[0], 飽食:[0], 力:[3], 陳情:[0], 真鯉:[0], 奥底:[0], 必須:[0], 凹凸:[0], 三つ:[3], 洗濯機:[4, 3], 外堀:[0], 空疎:[1], 颯と:[1, 0], 墓碑:[0, 1], 疎遠:[0], 勘定:[3], 襟元:[0, 4], 妄想:[0], 楽しむ:[3], 米穀:[0], 近年:[1], 襟巻き:[2], 大尉:[1], 恩赦:[1], 噴射:[0], 該当:[0], 入る:[1], 丹誠:[1], 骨髄:[0], 烏:[1], 喚起:[1], 批准:[0], 丹念:[1], 弔意:[1], 下がる:[2], 過剰:[0], 落ちる:[2], 漆:[0], 余剰:[0], 弔辞:[0], 敢行:[0], 下げる:[2], 習う:[2], 惜しい:[2], 披露宴:[2], 漆器:[0], 喚く:[2], 娘婿:[4], 上げる:[0], 出会う:[2], 召喚:[0], 召し上がる:[0, 4], 上:[0], 賓客:[0], 語る:[0], 疎ら:[0], 叙情:[0], 盲人:[0], 白人:[0], 投げ付ける:[0, 4], 色盲:[0], 傍:[1], 啓示:[0], 漆黒:[0], 粗塩:[0], 出口:[1], 慈悲:[1], 疾風:[0], 沸点:[1, 0], 啓発:[0], 慈善:[0], 抹殺:[0], 網羅:[1], 羅列:[0], 枯渇:[0], 羅針盤:[0], 送る:[0], 遥か:[1], 玄米:[1, 0], 傍観:[0], 胎児:[1], 腸:[1], 胎盤:[0], 目玉:[3], 開始:[0], 鎮魂:[0], 海賊:[0], 円:[1], 数える:[3], 裂く:[1], 噴水:[0], 不規則:[2, 3], 五:[1], 五つ:[2], 酵素:[1], 十月:[4], 支える:[0, 3], 女王:[2], 絶滅:[0], 向こう:[2, 0], 鼻詰まり:[0, 3], 追悼:[0], 四つ:[3], 右手:[0], 五十音順:[0], 円い:[0, 2], 苗字:[1], 残酷:[0], 七日:[0], 靴下:[2, 4], 絶やす:[2], 生地:[1], 構成:[0], 六日:[0], 目覚める:[3], 迷い:[3, 2], 肥料:[1], 火照る:[2], 電灯:[0], 殻:[2], 生きる:[2], 地殻:[0], 平和:[0], 学院:[0], 砂:[0], 取り戻す:[4, 0], 十日:[0], 枯れる:[0], 漬物:[0], 寛容:[0], 増す:[0], 血脈:[0], 消える:[0], 総帥:[0], 憂国:[0], 漬かる:[0], 芳香:[0], 棋譜:[1, 0], 年譜:[0], 赦免:[0], 内:[0], 渦:[1], 抹茶:[0], 渦中:[0, 1], 尚更:[0], 甚大:[0], 噴出:[0], 譜面:[0], 立てる:[2], 瓶詰:[0, 4], 最も:[3], 潤い:[0, 3], 抹消:[0], 容赦:[1], 悪戯:[0], 殉職:[0], 女の子:[3], 傍受:[1], 勝敗:[0], 甚だ:[0], 統帥:[0], 少ない:[3], 乾燥:[0], 恋愛:[0], 焦燥:[0], 農耕:[0], 徐行:[0], 親睦:[0], 拷問:[0], 牛:[0], 玄関:[1], 環礁:[0], 凝固:[1, 0], 徐々:[1], 耕作:[0], 束縛:[0], 岩礁:[0], 鶏:[0], 空き瓶:[0], 召す:[1], 花瓶:[0], 火炎瓶:[2], 聡明:[0], 禍根:[0], 惨事:[1], 鶏卵:[0], 東亜:[1], 戸口:[1, 0], 電車:[0, 1], 挟む:[4], 岬:[0], 外人:[0], 元凶:[0], 否:[1], 三世:[1], 浸す:[0, 2], 平安:[0], 先週:[0], 以上:[1], 命:[1], 崇高:[0], 緯度:[1], 凝視:[1, 0], 三日:[0], 凡庸:[0], 耕す:[3], 耕地:[1], 公用:[0], 読み方:[3, 0], 期待:[0], 浮気:[0], 見物:[0], 戦禍:[1], 流浪:[0], 古い:[2], 下唇:[4, 3], 貴賓:[0], 苗:[1], 累計:[0], 聡い:[2], 自粛:[0], 渓谷:[0], 偏食:[0], 肯く:[3, 0], 紡績:[0], 叙事詩:[2], 日没:[0], 噴火:[0], 叙述:[0], 噴煙:[0], 虚しい:[3, 0], 孤島:[0], 殊勝:[0], 孤立:[0], 厳粛:[0], 怠惰:[1], 瓜:[1], 魂胆:[1, 0], 特殊:[0], 緯線:[0], 草稿:[0], 意匠:[1, 0], 恒例:[0], 恒久:[0], 北緯:[1], 惰性:[0], 南緯:[1], 坪:[0], 庶民:[1], 投稿:[0], 生まれる:[0], 滑る:[2], 粗野:[1], 怠慢:[0], 慢性:[0], 擁護:[1], 犠牲:[0], 合繊:[0], 繊細:[0], 同胞:[0], 細胞:[0], 山葵:[1], 煩忙:[0], 埋没:[0], 凡人:[0], 本舗:[1], 露呈:[0], 出没:[0], 胡瓜:[1], 進呈:[0], 酷い:[2], 粗悪:[0], 神髄:[0, 1], 萌え:[0], 没収:[0], 冷酷:[0], 脂身:[3], 哺育:[0], 疎開:[0], 指紋:[0], 実践:[0], 戦場:[0], 波紋:[0], 鎌:[1], 密猟:[0], 店舗:[1], 孤児院:[2], 紋章:[0], 凝る:[1], 捕虜:[1], 狩猟:[0], 湖畔:[0], 過疎:[1], 外れる:[0], 舗装:[0], 尚:[1], 無秩序:[3, 2], 奉仕:[1, 0], 猟犬:[0], 艦艇:[0], 和尚:[1], 疾患:[0], 切る:[1], 逸品:[0], 秀逸:[0], 信奉:[0], 元旦:[0], 不祥事:[2], 膨張:[0], 下痢:[0], 競艇:[0], 高尚:[0], 逸脱:[0], 奉行:[1], 奉公:[1], 素朴:[0], 食糧:[2], 膨大:[0], 芳しい:[4], 苗木:[3, 0], 庶務:[1], 山荘:[0], 奉納:[0], 露顕:[0], 覇者:[1], 連覇:[1], 教諭:[0], 悠久:[0], 荘厳:[0], 噴き出す:[3, 0], 鯨肉:[0], 繁昌:[1], 虐殺:[0], 錦:[1], 悠長:[1], 別荘:[3], 賠償:[0], 啓蒙:[0], 寛大:[0], 虐待:[0], 諭す:[2, 0], 翻意:[1], 愚痴:[0], 欄:[1], 痴呆:[0], 童謡:[0], 顕著:[1], 弥生:[0], 陳述:[0], 暴虐:[0], 民謡:[0], 顕彰:[0], 循環:[0], 傲慢:[0, 1], 貫く:[3], 疎通:[0], 軒並:[0], 誘拐:[0], 貫き通す:[5], 鯨:[0], 欠点:[3], 引く:[0], 杏:[0], 暴騰:[0], 逸話:[0], 治癒:[1], 冷遇:[0], 境遇:[0], 遭難:[0], 陳腐:[1], 随時:[1], 止まる:[0], 栞:[0], 遭う:[1], 陥落:[0], 随所:[1], 之:[0], 佳作:[0], 哀悼:[0], 酷:[1, 2], 用いる:[3, 0], 随筆:[0], 栽培:[0], 疎外:[0], 応酬:[0], 起伏:[0], 随分:[1], 鎖国:[0], 鯉:[1], 惜敗:[0], 憂慮:[1], 封鎖:[0], 元帥:[1], 蔑む:[3], 追随:[0], 陥る:[3, 0], 空欄:[0], 閉鎖:[0], 頂:[0], 酷使:[1], 欄干:[0], 降伏:[0], 愉快:[1], 遺憾:[0, 1], 連鎖:[1], 拍手:[1], 殊に:[1], 酒好き:[0, 4], 欄外:[0], 潜伏:[0], 憂鬱:[0], 一抹:[0], 陥没:[0], 高騰:[0], 伏線:[0], 伏兵:[0], 練習:[0], 欠陥:[0], 隼:[0], 急騰:[0], 犠牲者:[2], 詠む:[1], 粗い:[0], 累積:[0], 脈拍:[0], 恥:[2], 望み:[0], 普遍的:[0], 遮断機:[2], 矯正:[0], 硫黄:[0], 非凡:[0], 匠:[0, 1], 巨匠:[0], 藻:[0], 平凡:[0], 宰相:[0], 呆れる:[0], 呉越同舟:[1], 主宰:[0], 静寂:[0], 少尉:[1], 海藻:[0], 碑文:[0], 故郷:[1], 野蛮:[0], 南蛮:[0], 中尉:[1], 尚且つ:[1], 疲弊:[0], 弊害:[0], 記念碑:[2], 謹賀新年:[4], 逝去:[1], 倹約:[0], 猶予:[1], 醜悪:[0], 醜態:[0], 醜聞:[0], 洪水:[0, 1], 疎か:[2], 窒息:[0], 方向音痴:[5], 穀物:[2], 匿名:[0], 縫う:[1], 縫製:[0], 升:[2, 0], 舶来:[0], 歌謡曲:[2], 管轄:[0], 所轄:[0], 直轄:[0], 無報酬:[2], 錯誤:[1], 升目:[0, 3], 石碑:[0], 唄う:[0], 囚人:[0], 飽きる:[2], 地下鉄:[0], 減俸:[0], 間伐:[0], 伐採:[0], 年俸:[0], 傍ら:[0], 凸版:[0], 堕落:[0], 恐喝:[0], 勇敢:[0], 景観:[0], 悪循環:[3], 海峡:[0], 盲目:[0], 均衡:[0], 婿:[1], 花婿:[3], 循環器:[3], 候補者:[3], 旋風:[0, 3], 果敢:[0], 敢闘:[0], 水槽:[0], 旋回:[0], 旋律:[0], 楓糖:[0], 浴槽:[0], 定款:[0], 約款:[0], 父親:[0], 角膜:[0], 胃腸:[0], 網膜:[0, 1], 不合格:[2], 寡婦:[1], 紺:[1], 濃紺:[0], 寡黙:[0], 大腸:[1], 平衡:[0], 萌芽:[1], 烏賊:[0], 山賊:[0], 盗賊:[0], 迎賓館:[3], 普遍:[0], 管弦楽団:[5, 6], 何遍:[1], 遍歴:[0], 神道:[1], 遮断:[0], 酵母:[1], 醸す:[2], 発酵:[0], 醸成:[0], 醸造:[0], 鎮まる:[3], 鼓動:[0], 検閲:[0], 校閲:[0], 鼓舞:[1], 鼓:[3, 0], 太鼓:[0], 鼓膜:[0], 享受:[1], 傑作:[0], 豪傑:[0], 嘱託:[0], 奔放:[0], 不朽:[0], 解剖:[0], 呆け:[2], 呆気:[0, 3], 奔走:[0], 媒介:[0], 媒体:[0], 秒針:[0], 扶養:[0], 媒酌:[0], 帆:[1], 帆走:[0], 弦楽器:[3], 管弦楽:[3], 回忌:[1, 0], 忌:[1], 禁忌:[1, 0], 一周忌:[3], 拍子:[3, 0], 思慕:[1], 感慨:[0], 憤慨:[0], 憤り:[0], 某:[1], 脊椎:[0, 2], 窃盗:[0, 3], 湧水:[0], 縫目:[3], 扶助:[1], 老朽:[0], 執行猶予:[5], 瑞々しい:[5], 紳士協定:[4], 淑やか:[2], 絹糸:[1], 藩主:[1], 切れる:[2], 起訴猶予:[3], 硫酸:[0], 絹:[1], 藩:[1], 系譜:[0], 金縛り:[3, 0], 縛り首:[3], 慕う:[0, 2], 手錠:[0], 蝶々:[1], 楽譜:[0], 感慨深い:[6], 更迭:[0], 晩酌:[0], 戯れ:[0, 4], 酌む:[0], 侮る:[3], 今日:[1], 陪審:[0], 飽き:[2], 桟橋:[0], 分泌:[0], 養鶏:[0], 侮蔑:[0], 侮辱:[0], 駐屯:[0], 卑屈:[0], 法曹:[0], 凹む:[0], 卑劣:[0], 叔父:[0], 叔母:[0], 吟味:[1, 3], 堪える:[2], 憧れる:[0], 慶事:[1], 憧れ:[0], 慶祝:[0], 慶弔:[0], 模擬:[1], 稚拙:[0], 擬装:[0], 取り敢えず:[3, 4], 浪費:[0, 1], 金持ち:[3], 劣る:[0, 2], 自叙伝:[2], 窮地:[1], 窮屈:[1], 阿呆:[2], 時期尚早:[1], 窮乏:[0], 胆石:[1, 0], 我慢:[1], 隠匿:[0], 困窮:[0], 紳士:[1], 自慢:[0], 閑静:[1], 苗床:[0], 葵:[0], 落胆:[0], 繊維:[1], 悠々:[0, 3], 制覇:[1], 土壌:[0], 尿:[1], 覇権:[0], 経緯:[1], 惨め:[1], 肯定:[0], 危篤:[0], 樹脂:[1], 残虐:[0], 風呂屋:[2], 累進:[0], 据え付ける:[4], 皮膚:[1], 蓮:[0], 船舶:[1], 突貫:[0], 煩雑:[0], 戦没:[0], 沈没:[0], 報酬:[0], 贈呈:[0], 紋:[1], 処遇:[0], 暁:[0], 濁流:[0], 鎮める:[0, 3], 偉い:[2], 沸く:[0], 漸く:[0], 示唆:[1], 玄人:[1, 2], 緋鯉:[0], 怠る:[0, 3], 緩慢:[0], 抱擁:[0], 没頭:[0], 兵糧:[0], 重鎮:[0], 膨れる:[0], 怠ける:[3], 膨らむ:[0], 軽蔑:[0], 廉価:[1], 洗浄剤:[3], 虐げる:[4], 錦鯉:[3], 逸らす:[2], 憂える:[3], 鎖:[0, 3], 惜しむ:[2], 酷暑:[1], 過酷:[0], 伏せる:[2], 頂戴:[3], 酷似:[0, 1], 不均衡:[2], 瓜実顔:[0, 4], 赤痢:[1], 鋳造:[0], 怠い:[2, 0], 醜い:[3], 縛る:[2], 逸れる:[2], 朽ちる:[2], 憂い:[3, 2], 峡谷:[0], 弔う:[3], 不愉快:[2], 敢えて:[1], 借款:[0], 漬ける:[0], 渓流:[0], 遮る:[3], 閲覧:[0], 凌ぐ:[2, 0], 呆れ返る:[4], 触媒:[0], 忌まわしい:[4], 戯れる:[4], 汚濁:[0], 肖像:[0], 感慨無量:[0], 錠剤:[0], 早乙女:[0], 峠:[3], 凸凹:[0], 缶コーヒー:[-1], 退院する:[0], 物:[2], 期待する:[0], 注文する:[0], 無視する:[1], 緊張する:[0], 混乱する:[0], 回復する:[0], 拝見する:[0], 掲載する:[0], 面接する:[0], 攻撃する:[0], 刊行する:[0], 準備する:[1], 想像する:[0], 共有する:[0], 保持する:[1], 誘惑する:[0], 勉強する:[0], 集中する:[0], 降参する:[0], 損害する:[0], 旅行する:[0], 催促する:[1], 妥協する:[0], 要求する:[0], 希望する:[0], 比較する:[0], 配達する:[0], 回転する:[0], 摘発する:[0], 編集する:[0], 充電する:[0], 批判する:[0], 説得する:[0], 検問する:[0], 発展する:[0], 応援する:[0], 支援する:[0], 援助する:[1], 存在する:[0], 提案する:[0], 判断する:[1], 確認する:[0], 対向する:[0], 登録する:[0], 締結する:[0], 逮捕する:[1], 解雇する:[1], 隠居する:[0], 招待する:[1], 診断する:[0], 購読する:[0], 抵抗する:[0], 延長する:[0], 発射する:[0], 輸入する:[0], 出版する:[0], 決定する:[0], 妊娠する:[0], 検査する:[1], 発揮する:[0], 尊敬する:[0], 賛成する:[0], 指摘する:[0], 辞儀する:[0], 投票する:[0], 襲撃する:[0], 克服する:[0], 延期する:[0], 反抗する:[0], 挿入する:[0], 理解する:[1], 連絡する:[0], 維持する:[1], 主催する:[0], 圧倒する:[0], 脱走する:[0], 掃除する:[0], 廃止する:[0], 一致する:[0], 同伴する:[0], 吸収する:[0], 応募する:[1], 結婚する:[0], 帰郷する:[0], 選択する:[0], 避難する:[1], 在留する:[0], 放送する:[0], 散歩する:[0], 開放する:[0], 遠慮する:[0], 指定する:[0], 消化する:[0], 心配する:[0], 感動する:[0], 整理する:[1], 合格する:[0], 卒業する:[0], 参加する:[0], 設定する:[0], 選挙する:[1], 保護する:[1], 営業する:[0], 寝坊する:[0], 紹介する:[0], 宣言する:[3], 否定する:[0], 差別する:[1], 検討する:[0], 輸出する:[0], 算定する:[0], 運転する:[0], 文句する:[1], 男の人:[6], 広島:[0], 区:[1], 犬:[2], 結構です:[-1], 田代島:[-1], 五台:[-1], この辺:[0], お尻:[-1], 四十二階:[-1], 今:[1], 福島:[-1], 一台:[-1], 心配事:[0], 迷惑メール:[5], お礼:[0], 三冊:[-1], 東京都:[3], 今まで:[-1], 気持ちいい:[-1], 奈良県:[-1], 船:[1], 中東:[0], 東京:[0], 胆:[0,1], 展示会:[3], 組:[2], 毒ガス:[0], 楽:[2], お祝い:[0], 千円札:[-1], 運がいい:[-1], 一冊:[-1], 千円:[1], 人達:[-1], 研修生:[3], 一億円:[-1], 全日本:[-1], 飲み放題:[3], 第二章:[-1], 緑色:[0], 雄犬:[-1], 仲良く:[-1], 京都:[1], 時々:[-1], 道に迷う:[-1], 服:[2], 彼ら:[-1], お客さん:[0], 泉:[0], 冷蔵庫:[3], 混む:[1], 肺臓:[0], 伝える:[0], 給油所:[-1], 横浜:[0], 待ちぼうけ:[-1], 二杯:[-1], 席:[1], 三番目:[-1], 奴ら:[-1], 結果:[0], 紀元後:[-1], ご飯:[-1], 急に:[-1], 使い方:[-1], 塊魂:[-1], 富士山:[1], 新宿:[0], 年代順:[-1], 食べ放題:[3], 四十:[1], 総体的:[-1], 旅行者:[2], 大間違い:[-1], 鼻の穴:[-1], 第一位:[-1], 上巻:[-1], 甘く見る:[-1], 将来:[1], 東口:[0], じゃが芋:[-1], 鰐蟹:[-1], 脳みそ:[-1], 吾輩:[-1], 北海道:[3], 薦め:[-1], 五枚:[-1], 機:[1], 仙台:[1], 同期中:[-1], 熊本県:[-1], 可燃ゴミ:[-1], 奈良:[1], 山中湖:[-1], 参加者:[3], 幕:[2], 中国製:[-1], 日本製:[-1], 君主国:[3], 背広:[0], ハチの巣:[-1], 観光客:[3], 過去形:[-1], 一杯:[1], 副大統領:[-1], 賞与金:[-1], バス停:[0], 今すぐ:[-1], 愛知県:[-1], 川崎:[-1], 長崎:[2], 長崎県:[-1], 中国:[1], お菓子:[2], 逆さま:[-1], 怪事件:[-1], 教授:[0], 巻きずし:[-1], 発売中:[-1], 棋院:[-1], 段々:[-1], 依存:[0], 押しボタン:[3], 複数形:[-1], 傷つく:[-1], 自民党:[-1], 御覧になる:[-1], 江戸:[0], 号:[1], 柱:[3], お陰で:[-1], 韓国:[1], 前売り券:[-1], 幼年時代:[-1], 足りない:[-1], 仕方がない:[-1], 頑張れ:[-1], お知らせ:[0], 興味がない:[-1], 撮影禁止:[0], 俺たち:[-1], 桜んぼ:[-1], 姫様:[1], 粒:[1], ゆで卵:[-1], 気に入る:[-1], ご覧:[-1], 筋:[1], 創造力:[-1], 揺る:[-1], 英語圏:[-1], 私:[0], 小さい順:[-1], 臭い:[2], 香港:[1], 鹿児島県:[-1], 入館料:[-1], 未決:[-1], 頼み:[3], 超自然的:[-1], 二倍:[-1], 一番:[2], 州:[1], 確かに:[-1], イギリス人:[4], 恥ずかしがる:[-1], 埼玉県:[-1], ゴミ箱:[-1], 縦書:[-1], 碁会所:[0,4], 日欧:[-1], 腰:[0], 何枚:[1], 垂れる:[2], 否定形:[-1], 神奈川県:[-1], 湿らせる:[-1], 明治維新:[-1], お見舞い:[0], 演奏:[0], 班:[1], 結局:[0], お婆ちゃん:[2], 締切:[-1], 伊勢:[-1], いつ頃:[-1], 缶ビール:[-1], エッフェル塔:[-1], 休憩所:[0], 俺ら:[-1], 間もなく:[-1], 癖に:[-1], 南米:[0], 四匹:[-1], 口笛を吹く:[-1], 紛れもない:[-1], 偶に:[-1], 南口:[0], 逃亡者:[-1], 鼻くそ:[-1], 高瀬:[-1], 渋谷:[0], 不孝者:[-1], ゴミ袋:[-1], 岐阜県:[-1], やり甲斐:[-1], お握り:[-1], 缶:[1], バベルの塔:[-1], 軍艦島:[-1], 柄:[0], ばい菌:[-1], 包み:[3], 塁打:[-1], 初めに:[-1], 菓子屋:[-1], 東芝:[-1], 空き缶:[0], 姫:[-1], 合唱団:[-1], 若い頃:[-1], 辞書形:[-1], 二巻:[-1], 二泊:[-1], 出かける:[-1], 耐久性:[-1], 役に立つ:[-1], 尺:[-1], 虹色:[-1], 台湾:[3], 粘々:[-1], 黒い霧:[-1], 回転ずし:[-1], 改訂版:[-1], 腹が減った:[-1], かき氷:[-1], 追いかける:[-1], 別の:[-1], 岡山県:[-1], 源氏物語:[-1], 説明書:[0], 不燃ゴミ:[-1], お嬢さん:[2], 三個:[-1], 規則正しい:[-1], 八冊:[-1], 御免なさい:[-1], 消しゴム:[0], 受領書:[-1], いい加減にしろ:[-1], お手洗い:[3], 角:[1], 株:[0], 結構:[1], お腹:[0], お構いなく:[-1], 移住者:[-1], 丁度いい:[-1], 工学者:[-1], 東京弁:[-1], 貿易会社:[-1], 丸:[0], 四千:[3], 四十二:[-1], 幾ら:[0,1], 本:[1], 沖縄:[0], 一万:[3], 依頼人:[-1], 二百:[-1], クモの巣:[-1], 通り:[3], 皿:[0], 気を付けて:[-1], 何月:[1], 二万:[-1], ビー玉:[0], 十台:[-1], 同日:[0,1], 二台:[-1], '２０１１年':[-1], 遠慮:[0], 口:[0], 久しぶり:[0], 何千:[-1], 徳川:[-1], 徳島県:[-1], 子:[0], 多分:[0,1], 高校生:[3], 大事:[1,3], 皮肉:[0], この前:[-1], 双:[1], 岐阜:[-1], 最新鋭:[-1], 募集中:[-1], 舟:[1], 大きく:[-1], この頃:[0], 眼:[1], 後で:[-1], いい加減:[-1], 米国:[0], 近づく:[-1], 二時半:[3], 数:[1], 局:[1], 折角:[0,4], 群馬県:[-1], 一割:[-1], 軸:[2], 歯を磨く:[-1], 朝ごはん:[-1], 陰気:[0], 門:[1], 押し:[0], 始めに:[-1], 大体:[0], フランス語:[0], 九州:[1], 掃除機:[3], 革命者:[-1], 白黒:[0], 前:[1], メモ帳:[0], 苦労:[1], 拡がる:[-1], 宜しくお願いします:[-1], 肺がん:[-1], 無闇に:[-1], 陽気:[0], 沖縄県:[-1], 誠に:[0], 列:[1], 誰か:[1], お盆:[2], 淀川:[-1], 本館:[0], お願いします:[-1], 点:[0], 束:[1], 芸能界:[-1], 都合:[0], 輪ゴム:[0], 卒業式:[3], 品:[0], 傷つける:[-1], 証:[0], 大阪:[0], 灯り:[-1], 朝ご飯:[-1], 仏僧:[-1], お守り:[0], うなぎ丼:[-1], 一等:[0,3], 地中海:[-1], 大失敗:[3], 慰謝:[-1], 大きい順:[-1], 電子機器:[-1], 共犯者:[-1], 千葉:[-1], 履き物:[-1], 嫌味:[-1], 首になる:[-1], 罰ゲーム:[3], 鬼:[2], 営業中:[0], 一層:[0], 携帯ストラップ:[-1], 女の人:[6], 会議室:[3], 票:[0], お誕生日おめでとう:[-1], 第一段:[-1], お疲れ様:[-1], 本当に:[-1], 花壇:[1], お前:[0], 親切:[1], 程よく:[-1], 昼ご飯:[-1], 腹:[2], 晩ご飯:[-1], 明治:[1], 数年:[0], 奥深い:[4], 背が高い:[-1], 周り:[0], 大学院生:[5], 米兵:[-1], 情けない:[-1], 研究所:[-1], 私自身:[-1], 革ジャン:[0], 研究室:[3], 香川県:[-1], 言葉つき:[-1], 嫌悪感:[-1], 御手洗:[-1], 桑原:[1,2], お酒:[0], 限定販売:[-1], 遠く:[3], 夏至:[0,2], 心持ち:[0], 四百:[1], 除いて:[-1], 怒らせる:[-1], 成程:[-1], スペイン語:[0], お金:[0], 凛々しい:[-1], 申し申し:[-1], 王冠:[-1], フランス人:[4], ふじ山:[1], 靖国神社:[-1], 殺人者:[-1], 乙:[1], 死刑囚:[-1], 浮浪者:[-1], 鎮痛剤:[-1], 洗濯屋:[-1], 愛媛県:[-1], 目:[1], 中古:[0], 名古屋:[1], 玉ねぎ:[-1], 手:[1], 日本:[2], シアトル市:[-1], 気持ち悪い:[-1], 飽くまでも:[-1], 洗濯粉:[-1], 鶏肉:[0], 十万:[3], 呆ける:[2], 賠償金:[-1], 舗:[-1], 陳列室:[-1], 必須条件:[-1], 蒙古:[-1], 一貫:[-1], 最優遇:[-1], お風呂:[2], 容赦なく:[-1], 平壌:[-1], 熊之実:[-1], 烏龍茶:[3], 一遍:[0,3], 錠:[0,1], 弁慶:[-1], ご無沙汰:[0], 栃木県:[-1], 没:[1], 胡座:[-1], 茨城県:[4], 南瓜:[0], 惜しまない:[-1], 太平洋:[3], '〜丁目':[3], '〜券':[-1], '〜札':[-1], '〜回':[-1], '〜冊':[-1], '〜間':[-1], '〜弁':[-1], '〜県':[-1], '〜様':[-1], '〜畑':[-1], '〜道':[-1], '〜層':[-1], '〜付き':[-1], '諸〜':[-1], '〜把':[-1], '〜症':[-1], '〜殿':[-1], '〜系':[-1], '超〜':[-1], '〜隊':[-1], '片〜':[-1], '〜匹':[-1], '〜剤':[-1], '〜歳':[-1], '〜亭':[-1], '〜階':[-1], '〜枚':[-1], '〜時':[-1], '〜台':[-1], '〜鍋':[-1], '〜狩り':[-1], '〜魂':[-1], '〜拍':[-1], '〜形':[-1], '〜度':[-1], '〜畳':[-1], '〜年来':[-1], '〜屋':[-1], '〜部':[-1], '〜君':[-1], '〜倍':[-1], '即〜':[-1], '〜放題':[-1], '〜向け':[-1], '〜的':[-1], '〜室':[-1], '各〜':[-1], '猛〜':[-1], '〜人':[-1], '〜務省':[-1], '〜号室':[-1], '〜貫':[-1], '〜達':[-1], '〜隻':[-1], '〜房':[-1], '〜病':[-1], '〜位':[-1], '〜才':[-1], '〜漬け':[-1], '〜軒':[-1],使用:[0], 以後:[1], 札:[0], 特選:[0], 人参:[0], 以降:[1], 辛口:[0], 御札:[0], 優れる:[3], 値札:[0], 品物:[0], 荷札:[1], 革命家:[0], 首位:[1],};
    var hiraDigraphs = ['ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ゃ', 'ゅ', 'ょ', 'ゎ', 'ゕ', 'ゖ'];
    var kataDigraphs = ['ァ', 'ィ', 'ゥ', 'ェ', 'ォ', 'ャ', 'ュ', 'ョ', 'ヮ', 'ヵ', 'ヶ'];

    // Get the color and the pitch pattern name
    var patternObj = {
        heiban: {
            name: '平板',
            nameEng: 'heiban',
            color: '#d20ca3',
        },
        odaka: {
            name: '尾高',
            nameEng: 'odaka',
            color: '#0cd24d',
        },
        nakadaka: {
            name: '中高',
            nameEng: 'nakadaka',
            color: '#27a2ff',
        },
        atamadaka: {
            name: '頭高',
            nameEng: 'atamadaka',
            color: '#EA9316',
        },
        unknown: {
            name: '不詳',
            nameEng: 'No pitch value found, click the number for more info.',
            color: '#CCCCCC',
        },
    };

    function getKanaInfo(kana) {
        // get information about the kana

        // count kana
        let kanaLength = 0;
        let digraphCount = 0;
        // do not include digraphs in kana length
        for (var i = 0; i < kana.length; i++) {
            if (!kataDigraphs.includes(kana[i]) && !hiraDigraphs.includes(kana[i])) {
                kanaLength++;
            } else {
                digraphCount++;
            };
        };
        let kanaPlusParticleLength = kanaLength + 1;
        return {kanaPlusParticleLength: kanaPlusParticleLength, kanaLength: kanaLength, digraphCount: digraphCount,};
    };

    function getPitchType(pitchNum, kanaLength) {
        var pattern = patternObj.unknown;

        if (pitchNum >= 0) {
            if (pitchNum == 0) {
                pattern = patternObj.heiban;
            } else if (pitchNum == 1) {
                pattern = patternObj.atamadaka;
            } else if (pitchNum > 1) {
                if (pitchNum == kanaLength) {
                    pattern = patternObj.odaka;
                } else {
                    pattern = patternObj.nakadaka;
                };
            };
        };
        return pattern;
    };

    //Pitch pattern drawing by https://github.com/blaketrahan
    function drawPitchDiagram(pitchNum, pitchNum2, kanaData) {
        // Prepare elements for drawing
        let patternType = getPitchType(pitchNum, kanaData.kanaLength);

        let fontSize = 14;
        let width = fontSize * (kanaData.kanaPlusParticleLength);

        let pitchDiagram = [];
        pitchDiagram.push('<svg xmlns="http://www.w3.org/2000/svg" version="1.1" class="svgPitchDiagram" height="35px" width="'+width+'">');

        // Start drawing
        var points = [];

        /* find pattern from table */
        var x = pitchNum;
        var y = kanaData.kanaLength - 1; //Our array is 0-based, so we need to subtract 1 from out length value.

        // get the points from pattern
        var drawnPoints = kanaData.kanaPlusParticleLength;
        if (pitchNum2 === undefined){
            for (var i = 0; i < kanaData.kanaPlusParticleLength; i++) {
                var high = pitchNum === 0 ? (i > 0) // heiban
                         : pitchNum === 1 ? (i === 0) // atamadaka
                         : (i > 0 && i < pitchNum); // nakadaka/odaka
                points.push({ x: fontSize * (i + 0.5), y: high ? '25%' : '75%' });
            };
            // draw lines between points
            for (var l = 0; l < points.length - 1; l++) {
                pitchDiagram.push(drawLine(points[l].x, points[l].y, points[l + 1].x, points[l + 1].y));
            };
            // draw circles at points
            for (var p = 0; p < points.length; p++) {
                pitchDiagram.push(drawPitchDot(points[p].x, points[p].y, p == points.length - 1));
            };
        } else {
            for (i = 0; i < kanaData.kanaPlusParticleLength; i++) {
                high = pitchNum === 0 ? (i > 0) // heiban
                     : pitchNum === 1 ? (i === 0) // atamadaka
                     : (i > 0 && i < pitchNum); // nakadaka/odaka
                points.push({ x: fontSize * (i + 0.5), y: high ? '5%' : '55%' });
            };
            // draw lines between points
            for (l = 0; l < points.length - 1; l++) {
                pitchDiagram.push(drawLine(points[l].x, points[l].y, points[l + 1].x, points[l + 1].y));
            };
            // draw circles at points
            for (p = 0; p < points.length; p++) {
                pitchDiagram.push(drawPitchDot(points[p].x, points[p].y, p == points.length - 1));
            };
             points = [];
            patternType = getPitchType(pitchNum2, kanaData.kanaLength);
            // get the points from pattern
            drawnPoints = kanaData.kanaPlusParticleLength;
            for (i = 0; i < kanaData.kanaPlusParticleLength; i++) {
                high = pitchNum2 === 0 ? (i > 0) // heiban
                     : pitchNum2 === 1 ? (i === 0) // atamadaka
                     : (i > 0 && i < pitchNum2); // nakadaka/odaka
                points.push({ x: fontSize * (i + 0.5), y: high ? '65%' : '95%' });
            };
            // draw lines between points
            for (l = 0; l < points.length - 1; l++) {
                pitchDiagram.push(drawLine(points[l].x, points[l].y, points[l + 1].x, points[l + 1].y));
            };
            // draw circles at points
            for (p = 0; p < points.length; p++) {
                pitchDiagram.push(drawPitchDot(points[p].x, points[p].y, p == points.length - 1));
            };
        };

        pitchDiagram.push('</svg>')
        return pitchDiagram.join('');

        function drawPitchDot(cx, cy, is_particle) {
            var w = 5; // dot size
            let circle = [];
            circle.push('<circle');
            circle.push(' fill='+ (is_particle ? '"#eeeeee"' : '"white"'));
            circle.push(' stroke="white"');
            circle.push(' stroke-width='+( is_particle ? '"1"' : '"0"'));
            circle.push(' cx="'+cx+'"');
            circle.push(' cy="'+cy+'"');
            circle.push(' r="'+ w / 2+'"');
            circle.push('></circle>')
            return circle.join('');
        };

        function drawLine(x1, y1, x2, y2) {
            let line = [];
            line.push('<line');
            line.push(' stroke="white"');
            line.push(' stroke-width="2"');
            line.push(' x1="'+x1+'"');
            line.push(' y1="'+y1+'"');
            line.push(' x2="'+x2+'"');
            line.push(' y2="'+y2+'"');
            line.push('></line>');
            return line.join('');
        };
    };

    function getPitchInfoDiagram(item){
        let pitchInfo = pitchInfoTable[item.data.characters];
        if (pitchInfo === undefined) return [];
        let pitchPattern = pitchInfo[0];
        let pitchPattern2 = pitchInfo[1];
        let reading = item.data.readings.filter(reading => reading.primary && reading.accepted_answer).map(reading => reading.reading)[0];
        let kanaData = getKanaInfo(reading);
        let pitchType = getPitchType(pitchPattern, kanaData.kanaLength);
        let pitchDiagrams = [];
        // do not display unknown pitch info
        if (pitchType.name !== '不詳') pitchDiagrams.push({pitchDiagrams: drawPitchDiagram(pitchPattern, pitchPattern2, kanaData), pitchType: pitchType});
        return pitchDiagrams;
    };

    // END Pitch Info

    // BEGIN Keisei Semantic-Phonetic Composition

    // Source @acm2010 at the Keisei Semantic Phonetic composition script
    // https://community.wanikani.com/t/userscript-keisei-%E5%BD%A2%E5%A3%B0-semantic-phonetic-composition/21479

    //================================================
    // BEGIN code by @acm2010 released under GPL V3 or later license
    //================================================

    // Wrapper object for Keisei database interactions
    // #############################################################################
    function KeiseiDB()
    {
        this.KTypeEnum = Object.freeze({
            unknown:         0,
            hieroglyph:      1, // 象形: type of character representing pictures
            indicative:      2, // 指事: indicative (kanji whose shape is based on logical representation of an abstract idea)
            comp_indicative: 3, // 会意: kanji made up of meaningful parts (e.g. "mountain pass" is up + down + mountain)
            comp_phonetic:   4, // 形声: kanji in which one element suggests the meaning, the other the pronunciation
            derivative:      5, // 転注: applying an extended meaning to a kanji
            rebus:           6, // 仮借: borrowing a kanji with the same pronunciation to convey an unrelated term
            kokuji:          7, // kanji originating from Japan
            shinjitai:       8, // Character was simplified from a different form (seiji)
            unprocessed:     9  // not yet visited
            }
        );

        this.wkradical_to_phon = {};
    }
    // #############################################################################

    // #############################################################################
    (function() {
       "use strict";

        KeiseiDB.prototype = {
            constructor: KeiseiDB,

            // #####################################################################
            init: function()
            {
                this.genWKRadicalToPhon();
                this.mapPhoneticsToKan(); // added by prouleau for Item Inspector
                this.findSemanticForKan(); // added by prouleau for Item Inspector
            },
            // #####################################################################

            // #####################################################################
            kdata: function(kanji)
            {
                return this.kanji_db[kanji];
            },
            // #####################################################################

            // #####################################################################
            checkKanji: function(kanji)
            {
                return Boolean(this.kanji_db && (kanji in this.kanji_db));
            },
            // #####################################################################
            // #####################################################################
            checkPhonetic: function(phon)
            {
                return Boolean(this.phonetic_db && (phon in this.phonetic_db));
            },
            // #####################################################################
            // #####################################################################
            checkRadical: function(phon)
            {
                return Boolean(this.phonetic_db && this.phonetic_db[phon] && this.phonetic_db[phon][`wk-radical`]);
            },
            // #####################################################################
            // #####################################################################
            getKType: function(kanji)
            {
                return this.KTypeEnum[this.kanji_db[kanji].type];
            },
            // #####################################################################

            // #####################################################################
            getKItem: function(kanji)
            {
                if (kanji in this.kanji_db)
                    return this.kanji_db[kanji];
                else
                    return {};
            },
            // #####################################################################

            // #####################################################################
            getWKItem: function(kanji)
            {
                if (kanji in this.wk_kanji_db)
                    return this.wk_kanji_db[kanji];
                else
                    return {"level": "N/A"};
            },
            // #####################################################################

            // #####################################################################
            getKReadings: function(kanji)
            {
                let result = [];

                if (!(kanji in this.kanji_db))
                    result = this.phonetic_db[kanji].readings;
                else
                    result = this.kanji_db[kanji].readings;

                if (!result.length)
                    return this.getWKOnyomi(kanji);
                else
                    return result;
            },
            // #####################################################################
            // #####################################################################
            getKPhonetic: function(kanji)
            {
                if (kanji in this.kanji_db)
                    return this.kanji_db[kanji].phonetic;
                else
                    return null;
            },
            // #####################################################################

            // Phonetic DB functions

            // #####################################################################
            getPCompounds: function(phon)
            {
                if (phon in this.phonetic_db)
                    return this.phonetic_db[phon].compounds;
                else
                {
                    console.log(`The following phonetic is not in the DB!`, phon);
                    return [];
                }
            },
            // #####################################################################
            // added by prouleau for Item Inspector
            // The phonetic field is used by @acm2010 code but it seems is not initialized
            // anywhere in the code. I had to reverse engineer the initialization
            // #####################################################################
            mapPhoneticsToKan: function()
            {
                Object.keys(this.kanji_db).forEach(
                    (kan) => {
                        this.kanji_db[kan].phonetic = [];
                        //if (this.checkPhonetic(kan)){
                        //    this.kanji_db[kan].phonetic.push(kan);
                        //}
                    });
                Object.keys(this.phonetic_db).forEach(
                    (phon) => {
                          this.phonetic_db[phon].compounds.forEach(
                               (kan) => {
                                   if (this.kanji_db[kan].phonetic.indexOf(phon) === -1 && this.checkPhonetic(phon)) this.kanji_db[kan].phonetic.push(phon);
                               })
                          /*this.phonetic_db[phon].xrefs.forEach(
                               (kan) => {
                                   if (this.kanji_db[kan].phonetic.indexOf(phon) === -1 && this.checkPhonetic(phon)) this.kanji_db[kan].phonetic.push(phon);
                               })*/
                    })
            },
            // #####################################################################
            // added by prouleau for Item Inspector
            // The semantic field is used by @acm2010 code but it seems is not initialized
            // anywhere in the code. I had to reverse engineer the initialization
            // #####################################################################
            findSemanticForKan: function()
            {
                Object.keys(this.phonetic_db).forEach(
                    (phon) => {
                        Object.keys(this.getPNonCompounds(phon)).forEach(
                            (kan) => {
                                if (this.kanji_db[kan] && this.kanji_db[kan].phonetic && this.kanji_db[kan].phonetic.indexOf(phon) === -1) this.kanji_db[kan].semantic = phon;
                            })
                    })
            },
            // #####################################################################
            // #####################################################################
            getPReadings: function(phon)
            {
                if (phon in this.phonetic_db)
                    return this.phonetic_db[phon].readings;
                else
                    return [];
            },
            // #####################################################################

            // Sort the readings by their importance (main readings first, then the
            // readings that are at least possible, and finally readings unused in
            // jouyou. Also add styles that reflect their importance.
            // #####################################################################
            getPReadings_style: function(phon)
            {
                let result = [];
                const rnd_length = this.phonetic_db[phon].readings.length;

                if (phon in this.phonetic_db)
                {
                    this.phonetic_db[phon].readings.forEach(
                        function(reading, i)
                        {
                            let rnd_count = 0;

                            [phon, ...this.phonetic_db[phon].compounds].forEach(
                                function(compound, j)
                                {
                                    if (!(compound in this.kanji_db))
                                        return;

                                    // Give a bonus to earlier readings in the phonetic's list
                                    if (this.kanji_db[compound].readings[0] === reading)
                                        rnd_count += 10 + (rnd_length-i);
                                    else if (this.kanji_db[compound].readings.includes(reading))
                                        rnd_count += 2 + (rnd_length-i);
                                },
                                this
                            );

                            if (!rnd_count)
                                result.push([rnd_count, `<span class="keisei_obscure_reading">${reading}</span>`]);
                            else if (rnd_count < 10)
                                result.push([rnd_count, `<span class="keisei_alternative_reading">${reading}</span>`]);
                            else
                                result.push([rnd_count, `<span class="keisei_main_reading">${reading}</span>`]);
                        },
                        this
                    );
                }

                return result.sort((a,b)=>b[0]-a[0]).map((d)=>d[1]);
            },
            // #####################################################################
            // #####################################################################
            getPXRefs: function(phon)
            {
                if (phon in this.phonetic_db)
                    return this.phonetic_db[phon].xrefs;
                else
                    return [];
            },
            // #####################################################################
            // #####################################################################
            getPNonCompounds: function(phon)
            {
                if (phon in this.phonetic_db)
                    return this.phonetic_db[phon].non_compounds;
                else
                    return [];
            },
            // #####################################################################

            genWKRadicalToPhon: function()
            {
                Object.keys(this.phonetic_db).forEach(
                    function(phon) {
                        const data = this.phonetic_db[phon];

                        this.wkradical_to_phon[data[`wk-radical`]] = phon;
                        this.wkradical_to_phon[phon] = phon;
                    },
                    this
                );
            },
            // #####################################################################
            mapWKRadicalToPhon: function(radical)
            {
                if (this.wkradical_to_phon && radical in this.wkradical_to_phon)
                    return this.wkradical_to_phon[radical];
                else
                    return null;
            },
            // #####################################################################
            getWKRadical: function(phon)
            {
                return this.phonetic_db[phon][`wk-radical`];
            },
            // #####################################################################
            getWKRadicalPP: function(phon)
            {
                if (this.phonetic_db && this.phonetic_db[phon][`wk-radical`])
                    return _.startCase(this.phonetic_db[phon][`wk-radical`]);
                else
                    return `Not in WK`;
            },
            // #####################################################################

            // #####################################################################
            isKanjiInWK: function(kanji)
            {
                return Boolean(this.wk_kanji_db && (kanji in this.wk_kanji_db));
            },
            // #####################################################################

            // #####################################################################
            isFirstReadingInWK: function(kanji)
            {
                if (this.isKanjiInWK(kanji))
                {
                    const onyomi = this.getWKOnyomi(kanji);

                    return (onyomi.includes(this.getKReadings(kanji)[0]));
                }
                else
                    return true;
            },
            // #####################################################################

            // Check if a kanji is considered obscure in regard to its phonetic,
            // ie, the kanji doesn't look like it has the phonetic at all.
            // #####################################################################
            isPObscure: function(kanji)
            {
                return Boolean(this.kanji_db && (`obscure` in this.kanji_db[kanji]));
            },
            // #####################################################################

            getWKOnyomi: function(kanji)
            {
                if (this.isKanjiInWK(kanji))
                {
                    if (this.wk_kanji_db[kanji].onyomi !== null)
                        return _.map(this.wk_kanji_db[kanji].onyomi.split(`,`), _.trim);
                    else
                        return [];
                }
                else
                    return [`*DB Error*`];
            },
            // #####################################################################
            getWKKMeanings: function(kanji)
            {
                let result = [];

                if (this.isKanjiInWK(kanji))
                    result = _.map(this.wk_kanji_db[kanji].meaning.split(`,`), _.trim);
                else
                {
                    if (this.kanji_db[kanji] === undefined)
                    {
                        console.log(`The kanji ${kanji} is not found in the DB!`);
                        result = [];
                    }
                    else
                        result = this.kanji_db[kanji].meanings;
                }

                return result.map(_.startCase);
            },
            // #####################################################################

            // #####################################################################
            deRendaku: function(reading)
            {
                let result = reading;

                const rendaku = `がぎぐげござじずぜぞだぢちづでどばびぶべぼぱぴぷぺぽ`;
                const vanilla = `かきくけこさしすせそたちしつてとはひふへほはひふへほ`;

                const pattern = _.zip(_.split(rendaku, ``), _.split(vanilla, ``));
                pattern.push([`じょ`, `よ`]);
                pattern.push([`じゃ`, `や`]);
                pattern.push([`じゅ`, `ゆ`]);

                _.forEach(pattern,
                    ([from_kana, to_kana]) =>
                        result = result.replace(from_kana, to_kana)
                );

                return result;
            },
            // #####################################################################

            // #####################################################################
            // Support for additional pages listing all tone mark
            // #####################################################################

            // #####################################################################
            getPhoneticsByCompCount: function()
            {
                let result = new Map();

                _.forEach(this.phonetic_db,
                    (p_item, phon) => {
                        const comp_len = p_item.compounds.length;

                        if (result.has(comp_len))
                            result.get(comp_len).push(phon);
                        else
                            result.set(comp_len, [phon]);
                    }
                );

                result.forEach(
                    (phons, count) => {
                        result.set(count, phons.sort(
                            (a,b)=>a.localeCompare(b, "ja-u-co-unihan")));
                    }
                );

                return new Map([...result.entries()].sort((a,b)=>b[0]-a[0]));
            },
            // #####################################################################

            // #####################################################################
            getPhoneticsByHeader: function()
            {
                const initials_d = new Map([
                    [`あ`, `あいうえお`],
                    [`か`, `かきくけこがぎぐげご`],
                    [`さ`, `さしすせそざじずぜぞ`],
                    [`た`, `たちつてとだぢづでど`],
                    [`な`, `なにぬねの`],
                    [`は`, `はひふへほばびぶべぼ`],
                    [`ま`, `まみむめも`],
                    [`ら`, `らりるれろ`],
                    [`や`, `やゆよ`],
                    [`わ`, `わを`]
                ]);

                let result = new Map();

                initials_d.forEach(
                    (subheaders, header) => {
                        result.set(header, new Map());

                        _.forEach(subheaders,
                            (subheader) => {
                                const sub_result = [];

                                _.forEach(this.phonetic_db,
                                    (p_item, phon) => {
                                        if (!p_item.readings.length)
                                            return;

                                        if (subheader.match(p_item.readings[0][0]))
                                            sub_result.push([2*p_item.compounds.length +
                                                        (p_item["wk-radical"]?1:0),
                                                        phon]);
                                    }
                                );

                                result.get(header).set(subheader,
                                                       sub_result
                                                        .sort((a,b)=>b[0]-a[0])
                                                        .map((d)=>d[1]));
                            }
                        );
                    },
                    this
                );

                return result;
            }
        };
        // #########################################################################
    }
    ());
    // #############################################################################

    var WK_Keisei = {};
    (function()
    {
        "use strict";

        // #########################################################################
        // Template strings with es6 features for the various explanations (first
        // paragraph for every information field).
        //
        // Inspired from https://stackoverflow.com/a/39065147/2699475
        WK_Keisei.explanation_non_radical = (subject) =>
           '<p>This radical is not considered a phonetic mark.</p>';

        WK_Keisei.explanation_radical = (subject, preadings) =>
           `<p>The radical 「${subject.phon}」 is used as a phonetic component in other compounds!
            Its ON reading(s) are 「${preadings.join("・")}」.
            Note that these can include historical readings that may not apply to this kanji itself anymore, but still do to its compounds.</p>`;

        WK_Keisei.explanation_unknown = (subject) =>
           `<p>The kanji 「${subject.kan}」 has an unknown or contested origin, or its phonetic mark is too obscure to be useful.
            Stay tuned for more information in future versions.</p>`;

        WK_Keisei.explanation_unprocessed = (subject) =>
           `<p>The kanji 「${subject.kan}」 has not been added to the DB yet, please wait for a future version.</p>`;

        WK_Keisei.explanation_phonetic = (subject, semantic, preadings) =>
           `<p>The kanji 「${subject.kan}」 was created using semantic-phonetic composition!<p>
            <p>The phonetic component is 「${subject.base_phon||subject.phon}」
            with the ON reading(s) 「${preadings.join("・")}」 (including rare ones),
            and the semantic component is 「${semantic}」.</p>`;

        WK_Keisei.explanation_pmark = (subject, preadings) =>
           `<p>The kanji 「${subject.kan}」 is used as a phonetic mark in other compounds!
            Its ON reading(s) as a phonetic mark are 「${preadings.join("・")}」.
            Note that these can include historical readings that may not apply to this kanji itself anymore, but still do to its compounds.</p>`;

        WK_Keisei.explanation_other = (subject) =>
           `<p>The kanji 「${subject.kan}」 is not considered a semantic-phonetic composition.</p>`;

        WK_Keisei.explanation_missing = (subject) =>
           '<p>This element is not listed in the Keisei database.</p>';

        WK_Keisei.error_msg = (subject, msg) =>
           `<p>An error occured while processing kanji 「${subject.kan}」! Message was: '${msg}'</p>`;
        // #########################################################################

        // Different paragraphs describing how well the current kanji is matched
        // by its corresponding phonetic mark.
        // #########################################################################
        WK_Keisei.pmark_perfect = (subject) =>
           '<p>The phonetic mark（天）is a perfect match because all readings of this kanji are derived from it.</p>';
        WK_Keisei.pmark_high = (subject) =>
           '<p>The phonetic mark（上）is a good match because the main readings of this kanji are derived from it.</p>`'
        WK_Keisei.pmark_middle = (subject) =>
           '<p>The phonetic mark（中）is a bad match because the kanji can be read that way in rare cases, '+
            'but the prevalent reading(s) are different.</p>';
        WK_Keisei.pmark_low = (subject) =>
           '<p>The phonetic mark（下）is no indicator at all for the readings of this kanji,'+
           ' they may have changed over time or the composition of this character is different after all.</p>';
        // #########################################################################

        // #########################################################################
        WK_Keisei.explanation_xref = (xref, preadings) =>
           `<p>The phonetic component 「${xref}」 is related to the above component, the readings may be similar.
            The ON reading(s) 「${preadings.join("・")}」 are listed for this phonetic mark.</p>`;
        WK_Keisei.explanation_non_compound = (subject) =>
           `<p>The phonetic component 「${subject.phon}」 also has kanji that are either phonetic compounds of another phonetic mark,
            or are considered a different type of composition. The readings are likely to differ.</p>`;
    }
    )();

    // Code extracted from the script, modified and wrapped into a function by prouleau
    function getNonPhoneticKanjiMsg(kan){
        let subject = {kan: kan, phon: keiseiDB.getKPhonetic(kan)};
        if (!keiseiDB.checkKanji(kan)) return WK_Keisei.explanation_missing(subject);
        switch (keiseiDB.getKType(kan))
        {
            case keiseiDB.KTypeEnum.unprocessed:
                return WK_Keisei.explanation_unprocessed(subject);
            case keiseiDB.KTypeEnum.unknown:
                return WK_Keisei.explanation_unknown(subject);
            case keiseiDB.KTypeEnum.hieroglyph:
            case keiseiDB.KTypeEnum.indicative:
            case keiseiDB.KTypeEnum.comp_indicative:
            case keiseiDB.KTypeEnum.derivative:
            case keiseiDB.KTypeEnum.rebus:
            case keiseiDB.KTypeEnum.kokuji:
            case keiseiDB.KTypeEnum.shinjitai:
                return WK_Keisei.explanation_other(subject);
            case keiseiDB.KTypeEnum.comp_phonetic:
                if (!subject.phon)
                {
                    return WK_Keisei.error_msg(subject, 'The phonetic element of this kanji was not in the database (or even no db)!');
                }

                return WK_Keisei.explanation_phonetic(
                        subject,
                        keiseiDB.getKItem(subject.kan).semantic,
                        keiseiDB.getPReadings_style(subject.phon));
            default:
                return WK_Keisei.error_msg(subject, 'The requested kanji is not in the database (or typo in DB)!');
        }
    }

    // Code extracted from the script, modified and wrapped into a function by prouleau
    function makeLabeledCompoundList (phon){
        // arrays used for sorting the 4 categories, append to front/back at each
        let char_list_lo = [];
        let char_list_hi = [];
        for (let kanji of keiseiDB.getPCompounds(phon)){
            let currentCompound = {kanji: kanji,};
            let subject = {kan: kanji, phon: phon};
            let badges = ['WkitBadge'];
            let explanations = [];

            let kReadings_deRen =
                _.map(keiseiDB.getKReadings(kanji), keiseiDB.deRendaku);
            let pReadings_deRen =
                _.map(keiseiDB.getPReadings(phon), keiseiDB.deRendaku);

            let common_readings_deRen = new Set(
                _.intersection(kReadings_deRen, pReadings_deRen));

            const common_readings = new Set(
                _.intersection(
                    keiseiDB.getKReadings(kanji),
                    keiseiDB.getPReadings(phon)));

            // Add a marker when the matching *improved*, either by
            // * more common readings, or
            // * less readings that only vary by dakuten versions
            if (common_readings_deRen &&
                (common_readings_deRen.size > common_readings.size ||
                 kReadings_deRen.length > new Set(kReadings_deRen).size))
                 badges.push('badge-rendaku');

            if (new Set(kReadings_deRen).size === common_readings_deRen.size)
            {
                badges.push('badge-perfect');
                char_list_hi.unshift(currentCompound);
                explanations.push(WK_Keisei.pmark_perfect(subject));
            }
            else if (!common_readings_deRen.size)
            {
                badges.push('badge-low');
                char_list_lo.push(currentCompound);
                explanations.push(WK_Keisei.pmark_low(subject));
            }
            else
            {
                // The first reading of this kanji at least appears somewhere
                if (pReadings_deRen.indexOf(kReadings_deRen[0]) !== -1)
                {
                    badges.push('badge-high');
                    char_list_hi.push(currentCompound);
                    explanations.push(WK_Keisei.pmark_high(subject));
                }
                else
                {
                    badges.push('badge-middle');
                    char_list_lo.unshift(currentCompound);
                    explanations.push(WK_Keisei.pmark_middle(subject));
                };
            };

            currentCompound.badges = badges.join(' ');
            currentCompound.explanations = explanations.join('\n');
        };
        // Push sorted list of all phonetic compounds
        return [...char_list_hi, ...char_list_lo];
     }

    //================================================
    // END code by @acm2010 released under GPL V3 or later license
    //================================================

    let keiseiDB;

    // function to be invoked in the startup sequence
    function loadKeiseiDatabase(){
        let promiseList = [];
        promiseList.push(load_file(kanji_db, true, {responseType: "arraybuffer"}).then(data => {lzmaDecompressAndProcessKanjiDB(data);}));
        promiseList.push(load_file(phonetic_db, true, {responseType: "arraybuffer"}).then(data => {lzmaDecompressAndProcessPhoneticDB(data);}));
        promiseList.push(load_file(wk_kanji_db, true, {responseType: "arraybuffer"}).then(data => {lzmaDecompressAndProcessWkKanjiDB(data);}));
        return Promise.all(promiseList).then(x => {keiseiDB = new KeiseiDB(); keiseiDB.init();});
    };

    function lzmaDecompressAndProcessKanjiDB(data){
        let inStream = new LZMA.iStream(data);
        let outStream = LZMA.decompressFile(inStream);
        let string = streamToString(outStream);
        KeiseiDB.prototype.kanji_db = JSON.parse(string);
    };

    function lzmaDecompressAndProcessPhoneticDB(data){
        let inStream = new LZMA.iStream(data);
        let outStream = LZMA.decompressFile(inStream);
        let string = streamToString(outStream);
        KeiseiDB.prototype.phonetic_db = JSON.parse(string);
    };

    function lzmaDecompressAndProcessWkKanjiDB(data){
        let inStream = new LZMA.iStream(data);
        let outStream = LZMA.decompressFile(inStream);
        let string = streamToString(outStream);
        KeiseiDB.prototype.wk_kanji_db = JSON.parse(string);
    };

    function deleteKeiseiCache(){
        wkof.file_cache.delete(kanji_db);
        wkof.file_cache.delete(phonetic_db);
        wkof.file_cache.delete(wk_kanji_db);
    }

    function makeKeiseiIconsRad(rad){
        let phon = keiseiDB.mapWKRadicalToPhon(rad);
        if (!keiseiDB.checkPhonetic(phon)) {
            return '<p class="WkitKeiseiMsg">This radical is not considered a phonetic mark.</p>';
        };
        let explanationList = [WK_Keisei.explanation_radical({rad: rad, phon: phon}, keiseiDB.getPReadings_style(phon))];
        let pushList = [{base: makeKeiseiIconsBase(phon, explanationList, false, false, rad), compounds: makeKeiseiIconsCompounds(phon)}];
        if (keiseiDB.getPXRefs(phon)) keiseiDB.getPXRefs(phon).forEach(rad => {pushList.push({base: makeKeiseiIconsBase(rad, [], true, false, rad), compounds: makeKeiseiIconsCompounds(rad)})})
        if (keiseiDB.getPNonCompounds(phon).length > 0) pushList.push({base: makeKeiseiIconsNonCompounds(phon), compounds: ''});
        return pushList;
    };

    function makeKeiseiIconsKan(kan){
        if (!keiseiDB.checkKanji(kan)) return WK_Keisei.error_msg({kan: kan}, 'The requested information is not in the Keisei database!');;
        if (!keiseiDB.checkPhonetic(kan) && (keiseiDB.getKType(kan) !== keiseiDB.KTypeEnum.comp_phonetic)) return getNonPhoneticKanjiMsg(kan);
        let phon = keiseiDB.getKPhonetic(kan)[0] || kan;
        let explanationList;
        let base_phon = kan;
        if (keiseiDB.checkPhonetic(kan)){
            explanationList = [WK_Keisei.explanation_pmark({kan: kan, phon: phon}, keiseiDB.getPReadings_style(kan))];
            if (phon !== kan){
                base_phon = phon;
                phon = kan;
            };
        } else {
            explanationList = [WK_Keisei.explanation_phonetic({kan: kan, phon: phon}, keiseiDB.getKItem(kan).semantic || '', keiseiDB.getPReadings_style(phon))];
        };
        let pushList = [];
        pushList.push({main: makeKeiseiMainKanIcon(kan, (base_phon === kan)),
                       base: makeKeiseiIconsBase(kan, explanationList, false, false, kan),
                       compounds: makeKeiseiIconsCompounds(kan)});
        keiseiDB.getPXRefs(kan).forEach(xref => {pushList.push({main: makeKeiseiMainKanIcon(kan, (kan !== base_phon && xref === base_phon)),
                                                                base: makeKeiseiIconsBase(xref, [], true, (kan !== base_phon && xref === base_phon), kan),
                                                                compounds: makeKeiseiIconsCompounds(xref)})})
        if (keiseiDB.getPNonCompounds(kan).length > 0) pushList.push({main: makeKeiseiMainKanIcon(kan, false),
                                                                      base: makeKeiseiIconsNonCompounds(kan), compounds: ''});
        return pushList;
    };

    function makeKeiseiIconsBase(phon, explanationList, isXref, base_phon, original_kan){
        if (!keiseiDB.checkPhonetic(phon)) phon = keiseiDB.getKPhonetic(phon)[0];
        let result = [];
        let explanation = '';
        let readings = keiseiDB.getPReadings(phon);
        let reading = readings[0] || '&nbsp;';
        let meaning = keiseiDB.checkPhonetic(phon) ? keiseiDB.getWKRadicalPP(phon) : 'Not in WK';
        result.push('<div class="keiseiPhon keiseiItem">');
        result.push('<span class="keiseiLarge">');
        result.push(phon);
        result.push('</span>');
        result.push('<span class="keiseiText">');
        result.push(reading);
        result.push('</span>');
        result.push('<span class="keiseiText">');
        result.push('Phonetic');
        result.push('</span>');
        result.push('</div>');
        if (meaning !== 'Not in WK'){
            result.push('<div class="keiseiRad keiseiItem">');
            result.push('<span class="keiseiLarge">');
            result.push(phon);
            result.push('</span>');
            result.push('<span class="keiseiText">');
            if (keiseiDB.checkRadical(phon)) {result.push(reading);} else {result.push('&nbsp;');};
            result.push('</span>');
            result.push('<span class="keiseiText">');
            result.push(meaning);
            result.push('</span>');
            result.push('</div>');
        };
        if (keiseiDB.checkKanji(phon)) {
            readings = keiseiDB.getKReadings(phon);
            reading = readings[0] || '&nbsp;';
            let meanings = keiseiDB.getWKKMeanings(phon);
            meaning = meanings[0] || '&nbsp;';
            let semantic = keiseiDB.getKItem(original_kan).semantic || '';
            explanation = (isXref && !base_phon ? WK_Keisei.explanation_xref(phon, keiseiDB.getPReadings_style(phon)):
                                                  WK_Keisei.explanation_phonetic({kan: original_kan, phon: phon}, semantic, keiseiDB.getPReadings_style(phon)));
            if (isXref || base_phon) explanationList.push(explanation);
            result.push('<div class="keiseiKan keiseiItem">');
            result.push('<span class="keiseiLarge">');
            result.push(phon);
            result.push('</span>');
            result.push('<span class="keiseiText">');
            result.push(reading);
            result.push('</span>');
            result.push('<span class="keiseiText">');
            result.push(meaning);
            result.push('</span>');
            result.push('</div>');
        };
        return {html: result.join(''), explanation: explanationList.join('<br>')};
    }

    function makeKeiseiIconsNonCompounds(phon){
        if (!keiseiDB.checkPhonetic(phon)) phon = keiseiDB.getKPhonetic(phon)[0];
        let result = [];
        let readings = keiseiDB.getPReadings(phon);
        let reading = readings[0] || '&nbsp;';
        result.push('<div class="keiseiNonPhon keiseiItem">');
        result.push('<span class="keiseiLarge">');
        result.push(phon);
        result.push('</span>');
        result.push('<span class="keiseiText">');
        result.push(reading);
        result.push('</span>');
        result.push('<span class="keiseiText">');
        result.push('Non Phonetic');
        result.push('</span>');
        result.push('</div>');
        for (let kanji of keiseiDB.getPNonCompounds(phon)) pushKanjiData({kanji: kanji, badges: ''}, result);
        return {html: result.join(''), explanation:  WK_Keisei.explanation_non_compound({kan:phon, phon: phon})};

    };

    function makeKeiseiIconsCompounds(phon){
        if (!keiseiDB.checkPhonetic(phon)) phon = keiseiDB.getKPhonetic(phon)[0];
        let result = [];
        let explanations = []
        let compound;
        for (compound of makeLabeledCompoundList(phon)){
            pushKanjiData(compound, result);
            if (explanations.length === 0 || compound.explanations !== explanations[explanations.length-1]) explanations.push(compound.explanations);
        }
        return {html: result.join(''), explanation: explanations.join('<br>')};
    };

    function makeKeiseiMainKanIcon(kan, badge){
        let compound;
        if (!badge || keiseiDB.getKType(kan) !== keiseiDB.KTypeEnum.comp_phonetic){
            compound = {kanji: kan, badges: ''}
        } else {
            let phon = keiseiDB.getKPhonetic(kan)[0];
            for(let cmp of makeLabeledCompoundList(phon)){
                if (cmp.kanji === kan){
                    compound = cmp;
                    break;
                };
            };
        };
        let result = [];
        pushKanjiData(compound, result);
        return result.join('');
    };

    function pushKanjiData(compound, result){
        let readings = keiseiDB.getKReadings(compound.kanji);
        let reading = readings[0] || '&nbsp;';
        let meanings = keiseiDB.getWKKMeanings(compound.kanji);
        let meaning = meanings[0];
        result.push('<div class="keiseiKan keiseiItem'+(compound.badges === '' ? '' : ' ' + compound.badges)+'">');
        result.push('<span class="keiseiLarge">');
        result.push(compound.kanji);
        result.push('</span>');
        result.push('<span class="keiseiText">');
        result.push(reading);
        result.push('</span>');
        result.push('<span class="keiseiText">');
        result.push(meaning);
        result.push('</span>');
        result.push('</div>');
    };

    // #############################################################################

    // END Keisei Semantic-Phonetic Composition

    // BEGIN Kanji Stroke Order SVG Files

    // This data is available on github at https://github.com/rouleaup88/Kanji-stroke-order
    // see https://community.wanikani.com/t/stroke-order-images-and-a-javascript-lzma-decompression-utility/47040/1
    // for more information

    // the object that will hold the images
    var strokeOrderSvgImages;

    // function to be invoked in the startup sequence
    function get_stroke_order_file(){
        return load_file(strokeOrderFileName, true, {responseType: "arraybuffer"})
             .then(function(data){lzmaDecompressAndProcessStrokeOrder(data)})
    };

    function lzmaDecompressAndProcessStrokeOrder(data){
        let inStream = new LZMA.iStream(data);
        let outStream = LZMA.decompressFile(inStream);
        let string = streamToString(outStream);
        strokeOrderSvgImages = JSON.parse(string);
    };

    function deleteStokeOrderCache(){
        wkof.file_cache.delete(strokeOrderFileName);
    }

    // converts the stream to a javascript string
    // the native stream.toString() methof of the LZMA
    // script is abysmally slow and a major source of latency
	function streamToString(outStream){
		var buffers = outStream.buffers, charList = [];
        if (window.TextDecoder){
            // TextDecoder supported - do it the fast way
            var decoder = new TextDecoder();
            for (let n = 0, nL = buffers.length; n < nL; n++) {
                charList.push(decoder.decode(buffers[n]));
            }
        } else {
            // TextDecoder unsupported - do it but a bit slower
            var conv = String.fromCharCode;
            for (let n = 0, nL = buffers.length; n < nL; n++) {
                var buf = buffers[n];
                for (var i = 0, iL = buf.length; i < iL; i++) {
                    charList.push(conv(buf[i]));
                }
            }
		}
		return charList.join('');
    }

    // END Kanji Stroke Order SVG Files

    //=================================================
    // End of Other external information not registered in metadata
    //-------------------------------------------------

    // ==========================================================
    // Events Handlers and Navigation
    //
    // Navigation is controlled by two variables
    //
    // currentItem in the most important. It is the index of the first item in quiz.items shown in the current screen
    // curentItem is always calculated when navigation occurs because it is needed to produce the html for the screen
    //
    // nextCurrentItem is the index of the first item in the next display
    // nextCurrentItem is calculated by the function that produces the html because the number of items may vary
    //

    /* control variables for the currently displayed tables*/
    var currentItem = 0;
    var nextCurrentItem;
    var nbItems = 0;

    function initCurrentItem(){
        currentItem = quiz.settings.tablePresets[quiz.settings.active_ipreset].currentItem;
        if (currentItem == undefined){currentItem = 0; nextCurrentItem = 0;};
        nextCurrentItem = quiz.settings.tablePresets[quiz.settings.active_ipreset].nextCurrentItem;
        if (nextCurrentItem == undefined){nextCurrentItem = currentItem;};
        nbItems = 3 * quiz.settings.numberOfLines;
    }

    const Wkit_navigation = 'Wkit_navigation';

    // event handler for go to first item button
    function clickedFirst(event) {
        document.getElementById("WkitFirstButton").blur();
        //test prevents multiple clicks
        if (!event.detail || event.detail == 1) {
            dataReady = false;
            wkof.wait_state(Wkit_navigation, 'Ready')
                .then(function(){
                        quiz.settings.audioMode = false;
                        formatControlBar();
                        let presets = quiz.settings.tablePresets[quiz.settings.active_ipreset]
                        currentItem = 0;
                        presets.currentItem = currentItem;
                        presets.nextCurrentItem = nextCurrentItem;
                        if (presets.selection === 'Date') presets.startDate = quiz.items[currentItem].sortKey;
                        if (presets.selection === 'Selection'){
                            presets.savedSelCurrentItem = currentItem;
                            presets.savedSelNextCurrentItem = nextCurrentItem;
                        };
                        wkof.set_state(Wkit_navigation, 'Pending')
                        wkof.Settings.save(scriptId).then(function(){wkof.set_state(Wkit_navigation, 'Ready')})
                        displayItems();
                        dataReady = true;
            });
        };
        return
    }

    // Event handler for go backward button
    function clickedBackward(event) {
        document.getElementById("WkitBackwardButton").blur();
        //test prevents multiple clicks
        if (!event.detail || event.detail == 1) {
            if (currentItem > 0){
                dataReady = false;
                wkof.wait_state(Wkit_navigation, 'Ready')
                    .then(function(){
                            quiz.settings.audioMode = false;
                            formatControlBar();
                            let presets = quiz.settings.tablePresets[quiz.settings.active_ipreset];
                            if (quiz.settings.listMode){
                                direction = 'Backward';
                                presets.nextCurrentItem = nextCurrentItem = currentItem;
                                presets.currentItem = currentItem - 1;
                                displayItems();
                                direction = 'Forward';
                                if (presets.selection === 'Date') presets.startDate = quiz.items[currentItem].sortKey;
                                presets.nextCurrentItem = nextCurrentItem;
                                presets.currentItem = currentItem;
                                wkof.set_state(Wkit_navigation, 'Pending')
                                wkof.Settings.save(scriptId).then(function(){wkof.set_state(Wkit_navigation, 'Ready')})
                                dataReady = true;
                            } else {
                                presets.nextCurrentItem = nextCurrentItem = currentItem;
                                currentItem = Math.max(currentItem - nbItems, 0);
                                presets.currentItem = currentItem;
                                if (presets.selection === 'Date') presets.startDate = quiz.items[currentItem].sortKey;
                                wkof.set_state(Wkit_navigation, 'Pending')
                                wkof.Settings.save(scriptId).then(function(){wkof.set_state(Wkit_navigation, 'Ready')})
                                displayItems()
                                dataReady = true;
                            }
                });
            }
        };
        return
    }

    // Event handler for go forward button
    function clickedForward(event) {
        document.getElementById("WkitForwardButton").blur();
        //test prevents multiple clicks
        if (!event.detail || event.detail == 1) {
            if(currentItem < nextCurrentItem && nextCurrentItem < quiz.items.length){
                dataReady = false;
                wkof.wait_state(Wkit_navigation, 'Ready')
                    .then(function(){
                            let presets = quiz.settings.tablePresets[quiz.settings.active_ipreset];
                            quiz.settings.audioMode = false;
                            formatControlBar();
                            currentItem = nextCurrentItem;
                            presets.currentItem = currentItem;
                            presets.nextCurrentItem = nextCurrentItem;
                            if (presets.selection === 'Date') presets.startDate = quiz.items[currentItem].sortKey;
                            wkof.set_state(Wkit_navigation, 'Pending')
                            wkof.Settings.save(scriptId).then(function(){wkof.set_state(Wkit_navigation, 'Ready')})
                            displayItems();
                            dataReady = true;
                });
            };
        };
        return
    }

    // Event handler for go to end of table button
    function clickedLast(event) {
        document.getElementById("WkitLastButton").blur();
        //test prevents multiple clicks
        if (!event.detail || event.detail == 1) {
            dataReady = false;
            wkof.wait_state(Wkit_navigation, 'Ready')
                .then(function(){
                        quiz.settings.audioMode = false;
                        formatControlBar();
                        let presets = quiz.settings.tablePresets[quiz.settings.active_ipreset];
                        if (quiz.settings.listMode){
                            direction = 'Backward';
                            presets.currentItem = currentItem = quiz.items.length;
                            presets.nextCurrentItem = nextCurrentItem = currentItem;
                            displayItems();
                            if (presets.selection === 'Date') presets.startDate = quiz.items[currentItem].sortKey;
                            presets.nextCurrentItem = nextCurrentItem;
                            presets.currentItem = currentItem;
                            wkof.set_state(Wkit_navigation, 'Pending')
                            wkof.Settings.save(scriptId).then(function(){wkof.set_state(Wkit_navigation, 'Ready')})
                            direction = 'Forward';
                            dataReady = true;
                        } else {
                            presets.nextCurrentItem = nextCurrentItem = currentItem;
                            currentItem = Math.max(quiz.items.length - nbItems, 0);
                            presets.currentItem = currentItem;
                            if (presets.selection === 'Date') presets.startDate = quiz.items[currentItem].sortKey;
                            wkof.set_state(Wkit_navigation, 'Pending')
                            wkof.Settings.save(scriptId).then(function(){wkof.set_state(Wkit_navigation, 'Ready')})
                            displayItems();
                            direction = 'Forward';
                            dataReady = true;
                        }
            });
        };
        return
    }

    // Event handler for table selection dropdown
    function selectTable(event) {
        dataReady = false;
        document.getElementById("WkitTableSelector").blur();
        wkof.wait_state(Wkit_navigation, 'Ready')
            .then(function(){
                    quiz.settings.audioMode = false;
                    formatControlBar();
                    resetTemporaryFilters();
                    quiz.savedItems = [];
                    let selected = quiz.settings.active_ipreset = $('#WkitTableSelector').prop('selectedIndex');
                    setSelectionButtonsColors()
                    wkof.set_state(Wkit_navigation, 'Pending')
                    wkof.Settings.save(scriptId).then(function(){wkof.set_state(Wkit_navigation, 'Ready')})
                    filter_items_for_table();
                    updatePage();
                    dataReady = true;
        });
    };

    // Event handler for toggling between table mode and icon list mode
    function toggleDisplay(event) {
        document.getElementById("WkitToogleDisplay").blur();
        //test prevents multiple clicks
        if (!event.detail || event.detail == 1) {
            dataReady = false;
            wkof.wait_state(Wkit_navigation, 'Ready')
                .then(function(){
                        quiz.settings.listMode = !quiz.settings.listMode;
                        quiz.settings.audioMode = false;
                        formatControlBar();
                        wkof.set_state(Wkit_navigation, 'Pending')
                        wkof.Settings.save(scriptId).then(function(){wkof.set_state(Wkit_navigation, 'Ready')})
                        displayItems();
                        dataReady = true;
            });
        };
        return
    };

    // Event handler for toggling between Japanese and English modes
    function toggleLanguage(event) {
        document.getElementById("WkitToogleLanguage").blur();
        //test prevents multiple clicks
        if (!event.detail || event.detail == 1) {
            dataReady = false;
            wkof.wait_state(Wkit_navigation, 'Ready')
                .then(function(){
                        let a = quiz.settings.tablePresets[quiz.settings.active_ipreset].displayMeaning;
                        quiz.settings.tablePresets[quiz.settings.active_ipreset].displayMeaning = !a;
                        quiz.settings.audioMode = false;
                        formatControlBar();
                        wkof.set_state(Wkit_navigation, 'Pending')
                        wkof.Settings.save(scriptId).then(function(){wkof.set_state(Wkit_navigation, 'Ready')})
                        displayItems();
                        dataReady = true;
            });
        };
        return
    };

    // Event handler for toggling between audio and links to item page
    function toggleAudio(event) {
        document.getElementById("WkitToogleAudio").blur();
        //test prevents multiple clicks
        if (!event.detail || event.detail == 1) {
            let a = quiz.settings.audioMode;
            quiz.settings.audioMode = !a;
            formatControlBar();
            displayItems();
        };
        return
    };

    // event handler for Random Selection button
    function toggleRandomSelection(event) {
        document.getElementById("WkitRandomSelection").blur();
        //test prevents multiple clicks
        if (!event.detail || event.detail == 1) {
            dataReady = false;
            wkof.wait_state(Wkit_navigation, 'Ready')
                .then(function(){
                        let settings = quiz.settings;
                        let presets = settings.tablePresets[settings.active_ipreset];
                        settings.audioMode = false;
                        if (quiz.items === undefined) console.trace();
                        formatControlBar();
                        resetTemporaryFilters();
                        if (quiz.items === undefined) console.trace();
                        if (presets.selection === 'None'){
                            presets.selection = 'Random';
                            presets.savedCurrentItem = currentItem;
                            presets.savedNextCurrentItem = nextCurrentItem;
                            quiz.savedItems = quiz.items.slice(0, quiz.items.length);
                            doRandomSelection();
                            if (quiz.items === undefined) console.trace();
                            $('#WkitRandomSelection').toggleClass("WkitActive");
                        } else if (presets.selection === 'Date') {
                            presets.selection = 'Random';
                            quiz.items = quiz.savedItems.slice(0, quiz.savedItems.length);
                            doRandomSelection();
                            if (quiz.items === undefined) console.trace();
                            $('#WkitRandomSelection').toggleClass("WkitActive");
                            $('#WkitDateOrdering').toggleClass("WkitActive");
                        } else {
                            presets.selection = 'None';
                            quiz.items = quiz.savedItems;
                            if (quiz.items === undefined) console.trace();
                            quiz.savedItems = [];
                            presets.currentItem = currentItem = presets.savedCurrentItem;
                            presets.nextCurrentItem = nextCurrentItem = presets.savedNextCurrentItem;
                            $('#WkitRandomSelection').toggleClass("WkitActive");
                        };
                        wkof.set_state(Wkit_navigation, 'Pending')
                        wkof.Settings.save(scriptId).then(function(){wkof.set_state(Wkit_navigation, 'Ready')})
                        if (quiz.items === undefined) console.trace();
                        displayItems();
                        dataReady = true;
                    });
        };
        return
    };

    // ----------------------------------------------------
    // BEGIN series of functions for doing random selection
    // ----------------------------------------------------

    function doRandomSelection(){
        let settings = quiz.settings;
        let presets = settings.tablePresets[settings.active_ipreset];
        shuffle(quiz.items);
        if (quiz.items === undefined) console.log('Found undefined quiz.items at random selection')
        quiz.items.forEach(item => {if (item === undefined)console.log('found undefined item at random selection')})
        presets.currentItem = currentItem = 0;
        if (presets.randomSelection !== 0){
            nextCurrentItem = presets.randomSelection;
        } else if (settings.listMode){
            createItemList(quiz.items, true); // find out how many items fit the screen
        } else {
            nextCurrentItem = currentItem + nbItems;
        };
        console.log('tests', presets.oncePerReviewPeriod, presets.addSimilarItems);
        if (presets.oncePerReviewPeriod || presets.addSimilarItems){
            quasiEmulateLeechTrainer();
            if (settings.listMode && presets.randomSelection === 0) createItemList(quiz.items, true); // find out how many items fit the screen
            quiz.items = quiz.items.slice(0, nextCurrentItem);
            shuffle(quiz.items);
        } else {
            quiz.items = quiz.items.slice(0, nextCurrentItem);
        };
        if (quiz.items === undefined) console.log('Found undefined quiz.items at random selection after slice')
        presets.nextCurrentItem = nextCurrentItem;
        saveSelectedItems();
        if (quiz.items === undefined) console.trace();
    };

    function shuffle(items){
        for(let i = items.length - 1; i >= 0; i--){
            const j = Math.floor(Math.random() * i);
            const temp = items[i];
            items[i] = items[j];
            items[j] = temp;
        }
        return items
    }

    function saveSelectedItems(){
        let settings = quiz.settings;
        let storageName = 'Wkit_' + settings.ipresets[settings.active_ipreset].name;
        sessionStorage.setItem(storageName, JSON.stringify(quiz.items.map(item => item.id)));
    };

    function retrieveSelecteditems(noCreateTable){
        let settings = quiz.settings;
        let presets = settings.tablePresets[settings.active_ipreset];
        let storageName = 'Wkit_' + settings.ipresets[settings.active_ipreset].name;
        let ids = JSON.parse(sessionStorage.getItem(storageName));
        if (ids === null) {
            presets.selection = "None";
            presets.currentItem = currentItem = presets.savedCurrentItem;
            presets.nextCurrentItem = nextCurrentItem = presets.savedNextCurrentItem;
            if (presets.currentItem >= quiz.items.length){
                presets.currentItem = currentItem = 0;
                presets.nextCurrentItem = nextCurrentItem = 0;
            if ($('#WkitRandomSelection').hasClass("WkitActive")) $('#WkitRandomSelection').toggleClass("WkitActive");
            if ($('#WkitDateOrdering').hasClass("WkitActive")) $('#WkitDateOrdering').toggleClass("WkitActive");
            };
            wkof.set_state(Wkit_navigation, 'Pending')
            wkof.Settings.save(scriptId).then(function(){wkof.set_state(Wkit_navigation, 'Ready'); dataReload('table')});
            return false;
        } else {
            quiz.savedItems = quiz.items.slice(0, quiz.items.length);
            quiz.items = ids.map(id => subjectIndex[id])
            presets.currentItem = currentItem = 0;
            presets.nextCurrentItem = nextCurrentItem = quiz.items.length;
            if (!$('#WkitRandomSelection').hasClass("WkitActive")) $('#WkitRandomSelection').toggleClass("WkitActive");
            if ($('#WkitDateOrdering').hasClass("WkitActive")) $('#WkitDateOrdering').toggleClass("WkitActive");
            return true;
        }
    }

    function quasiEmulateLeechTrainer(){
        let userLevel = userData.level;
        let settings = quiz.settings;
        let presets = settings.tablePresets[settings.active_ipreset];
        let selected = {};
        let tempItems = [];
        let selectedCount = 0;
        let now = new Date().getTime();

        // It is better get more items than necessary - caller will trim them to fit the screen or settings
        for (let i = currentItem; (i < quiz.items.length) && (selectedCount < nextCurrentItem + 10); i++){
            let item = quiz.items[i];
            let reviewDate = (item.assignments ? computeLastReviewDate(item) : theFuture);
            if (!presets.oncePerReviewPeriod || (notSelectedYet(item))) {
                tempItems.push(item);
                selected[item.id] = true;
                selectedCount++
                lastSelectionRecorded[item.id] = now;
                if (presets.addSimilarItems) addSimilarItems(item);
            };
        };
        saveLastSelectionRecorded();
        quiz.items = tempItems;

        function notSelectedYet(item){
            let id = item.id;
            if (selected[id]) return false;
            let lastSelectionDate = lastSelectionRecorded[id] || 0;
            let reviewDate = (item.assignments ? computeLastReviewDate(item) : theFuture);
            return (reviewDate > lastSelectionDate);
        };

        function addSimilarItems(item){
            let itemLimit = 2;
            let visuallySimilar, itemLimitCount, components, usedIn, candidates, isSimilar, length, seen;
            switch (item.object) {
                case 'radical':
                    return;
                case 'kanji':
                    // use WK and Lars Yencken data for kanji similarity - plain WK data does not yield enough similar items

                    // Produce an arrays of characters that includes
                    //    1- the LY visually similar kanji for the component provided they exist in the LY database and pass the configured similarity threshold
                    //    2- The WK visually similar kanji

                    // First get the visually similar item list if it exist - makeItemListVisSimKan honors the configured visually similar threshold
                    visuallySimilar = (visuallySimilarData[item.data.characters] ? makeItemListVisSimKan(visuallySimilarData[item.data.characters]) : [])
                                        // filter to retain only kanji for which lessons have been taken - some LY kanji are not WK kanji and must be filtered out too
                                        .filter((kanji) => (kanjiIndex[kanji.data.characters] && kanjiIndex[kanji.data.characters].assignments
                                                            && kanjiIndex[kanji.data.characters].assignments.started_at !== null))
                                        // map to retain only subject ids for the rest of the algorithm
                                        .map((kanji) => kanji.id)
                                        // add visually similar data - only if lessons have been taken
                                  //      item.data.visually_similar_subject_ids.filter((id) => subjectIndexKan[id].assignments &&
                                  //                                                            subjectIndexKan[id].assignments.started_at !== null);
                    shuffle(visuallySimilar);
                    itemLimitCount = 0;
                    for (let id of visuallySimilar){
                        if (notSelectedYet(subjectIndexKan[id])){
                            tempItems.push(subjectIndexKan[id]);
                            selected[id] = true;
                            lastSelectionRecorded[id] = now;
                            selectedCount++;
                            if (itemLimitCount++ >= itemLimit) break;
                        }
                    };
                    break;
                case 'vocabulary':
                    length = item.data.characters.length;
                    components = [];
                    for (let character of item.data.characters) if (character in kanjiIndex) components.push(kanjiIndex[character]);

                    // use WK and Lars Yencken data for vocab similarity - plain WK data does not yield enough similar items

                    // Produce an arrays of characters for each component that includes
                    //    1- the LY visually similar kanji for the component provided they exist in the LY database
                    //    2- The WK visually similar kanji
                    //    3- also include the component kanji because it is similar to itself

                    // First get the visually similar item list - makeItemListVisSimKan honors the configured visually similar threshold
                    // Adds the component kanji
                    visuallySimilar = components.map((kanji) => (visuallySimilarData[kanji.data.characters]
                                                                 ? makeItemListVisSimKan(visuallySimilarData[kanji.data.characters])
                                                                 : [kanji.data.characters])
                                                                 // concatenate the WK visually similar kanji character to the LY and base kanji
                                                                 .concat(kanji.data.visually_similar_subject_ids.map((id) => subjectIndexKan[id].data.characters)))
                                             // filter to retain only kanji for which lessons have been taken - some LY kanji are not WK kanji and must be filtered out too
                                                .map((charList) => charList.filter((kanji) => (kanjiIndex[kanji] && kanjiIndex[kanji].assignments &&
                                                                                               kanjiIndex[kanji].assignments.started_at !== null)))
                                                 // map the whole thing to subject id because the rest of the algorithm is not good with characters
                                                .map((charList) => (charList.map((kanji) => kanjiIndex[kanji].id)));
                    candidates = visuallySimilar[0].reduce(function(acc, id){return acc.concat(subjectIndexKan[id].data.amalgamation_subject_ids)}, []);
                    candidates = candidates.filter((id) => (subjectIndexVoc[id].assignments && subjectIndexVoc[id].assignments.started_at !== null));
                    shuffle(candidates);
                    itemLimitCount = 0;
                    seen = {};
                    for (let candidate of candidates){
                        components = [];
                        for (let character of subjectIndexVoc[candidate].data.characters) if (character in kanjiIndex) components.push(kanjiIndex[character].id);
                        if (components.length !== visuallySimilar.length) continue;
                        isSimilar = true;
                        // every original kanji must be similar to one candidate kanji in any order, no two kanji match the same kanji
                        for (let idx in visuallySimilar){
                            let isSimilar2 = false;
                            for (let idx2 in components){
                                if (visuallySimilar[idx].indexOf(components[idx2]) >= 0 && !(idx2 in seen)){
                                    isSimilar2 = true;
                                    seen[idx2] = true;
                                };
                            };
                            isSimilar =isSimilar && isSimilar2;
                        };
                        if (isSimilar && notSelectedYet(subjectIndexVoc[candidate])){
                            tempItems.push(subjectIndexVoc[candidate]);
                            selected[candidate] = true;
                            lastSelectionRecorded[candidate] = now;
                            selectedCount++;
                            if (itemLimitCount++ >= itemLimit) break;
                        };
                    };
                    break;
            };
        };
    };

    const Wkit_lastSelectionRecorded = 'Wkit_LastSelectionRecorded';
    var lastSelectionRecorded;

    function initLastSelectionRecorded(){
        return wkof.file_cache.load(Wkit_lastSelectionRecorded)
                    .then(function(data){lastSelectionRecorded = data;})
                    .catch(function(){lastSelectionRecorded = {}});
    };

    function saveLastSelectionRecorded(){
        for (let id of Object.keys(lastSelectionRecorded)){
            let reviewDate = (subjectIndex[id].assignments ? computeLastReviewDate(subjectIndex[id]) : theFuture);
            if (lastSelectionRecorded[id] < reviewDate) {delete lastSelectionRecorded[id]};
        };
        return wkof.file_cache.save(Wkit_lastSelectionRecorded, lastSelectionRecorded);
    };

    // -------------------------------------------------
    // END series of function for doing random selection
    // -------------------------------------------------

    // Event handler for ordering by date button
    function toggleDateOrdering(event) {
        document.getElementById("WkitDateOrdering").blur();
        //test prevents multiple clicks
        if (!event.detail || event.detail == 1) {
            dataReady = false;
            wkof.wait_state(Wkit_navigation, 'Ready')
                .then(function(){
                        let settings = quiz.settings;
                        let presets = settings.tablePresets[settings.active_ipreset];
                        settings.audioMode = false;
                        formatControlBar();
                        resetTemporaryFilters();
                        if (presets.selection === 'None'){
                            presets.selection = 'Date';
                            quiz.savedItems = quiz.items.slice(0, quiz.items.length);
                            doDateOrdering();
                            $('#WkitDateOrdering').toggleClass("WkitActive");
                        } else if (presets.selection === 'Random') {
                            presets.selection = 'Date';
                            quiz.items = quiz.savedItems.slice(0, quiz.savedItems.length);
                            orderByDate(quiz.items);
                            presets.currentItem = currentItem; // should be determined by order by date
                            presets.nextCurrentItem = nextCurrentItem = currentItem;
                            $('#WkitRandomSelection').toggleClass("WkitActive");
                            $('#WkitDateOrdering').toggleClass("WkitActive");
                        } else {
                            presets.selection = 'None';
                            quiz.items = quiz.savedItems;
                            quiz.savedItems = [];
                            presets.currentItem = currentItem = presets.savedCurrentItem;
                            presets.nextCurrentItem = nextCurrentItem = presets.savedNextCurrentItem;
                            $('#WkitDateOrdering').toggleClass("WkitActive");
                        };
                        wkof.set_state(Wkit_navigation, 'Pending')
                        wkof.Settings.save(scriptId).then(function(){wkof.set_state(Wkit_navigation, 'Ready')})
                        displayItems();
                        dataReady = true;
            });
        };
        return
    };

    function doDateOrdering (){
        let settings = quiz.settings;
        let presets = settings.tablePresets[settings.active_ipreset];
        presets.savedCurrentItem = currentItem;
        presets.savedNextCurrentItem = nextCurrentItem;
        orderByDate(quiz.items);
        presets.currentItem = currentItem; // should be determined by order by date
        presets.nextCurrentItem = nextCurrentItem = currentItem;
    }

    function orderByDate(){
        let settings = quiz.settings.tablePresets[quiz.settings.active_ipreset];
        let sortKey = metadata[settings.navigationDate].preciseSortkey;
        let items = quiz.items;
        items.forEach((item) => {item.sortKey = sortKey(item);});
        items = items.sort(function(a, b){return a.sortKey - b.sortKey });
        let referenceDate = settings.startDate;
        var i = 0;
        var startDate = settings.startDate;

        let start=0, end=items.length-1;
        let mid;
        // binary search - searching for startDate
        while (start<=end){
            mid=Math.floor((start + end)/2);
            if (mid === 0) break;
            if (items[mid].sortKey===startDate && items[mid-1].sortKey!==startDate){
                break;
            } else if (items[mid].sortKey < startDate) {
                 start = mid + 1;
            } else {
                 end = mid - 1;
            }
        }
        currentItem = mid;

        start=0; end=items.length-1;
        // binary search - searching for theFuture === missing date.
        while (start<=end){
            mid=Math.floor((start + end)/2);
            if (mid === 0){break}
            if (items[mid].sortKey===theFuture && items[mid-1].sortKey!==theFuture){
                break;
            } else if (items[mid].sortKey < theFuture) {
                 start = mid + 1;
            } else {
                 end = mid - 1;
            }
        }
        if (items[mid].sortKey === theFuture) quiz.items = items.slice(0, mid);
        if (currentItem >= quiz.items.length) currentItem = Math.max(quiz.items.length - nbItems, 0);
    };

    // event handler for temporary filter selection dropdown
    function selectTemporaryFilter(event) {
        document.getElementById("WkitFilterSelector").blur();
        dataReady = false;
        wkof.wait_state(Wkit_navigation, 'Ready')
            .then(function(){
                    let settings = quiz.settings;
                    let selected = settings.active_fpreset = $('#WkitFilterSelector').prop('selectedIndex');
                    settings.audioMode = false;
                    formatControlBar();
                    let presets = settings.tablePresets[settings.active_ipreset];
                    if (settings.active_fpreset === 0){
                        if (!firstTemporaryFilter) {
                            firstTemporaryFilter = true;
                            quiz.items = quiz.unfilteredItems;
                            quiz.unfilteredItems = [];
                            currentItem = presets.savedCurrentItem;
                            nextCurrentItem = presets.savedNextCurrentItem;
                        }
                        wkof.set_state(Wkit_navigation, 'Pending');
                        wkof.Settings.save(scriptId).then(function(){wkof.set_state(Wkit_navigation, 'Ready')});
                        displayItems();
                        dataReady = true;
                        return;
                    }
                    let selection = presets.selection;
                    if (selection === 'Date') {
                        presets.selection = 'None'
                        quiz.items = quiz.savedItems;
                        presets.currentItem = currentItem = presets.savedCurrentItem;
                        presets.nextCurrentItem = nextCurrentItem = presets.savedNextCurrentItem;
                        $('#WkitDateOrdering').toggleClass("WkitActive");
                    } else if (selection === 'Random') {
                        presets.selection = 'None';
                        quiz.items = quiz.savedItems;
                        presets.currentItem = currentItem = presets.savedCurrentItem;
                        presets.nextCurrentItem = nextCurrentItem = presets.savedNextCurrentItem;
                        $('#WkitRandomSelection').toggleClass("WkitActive");
                    }
                    if (firstTemporaryFilter) {
                        firstTemporaryFilter = false;
                        quiz.unfilteredItems = quiz.items;
                        presets.savedCurrentItem = currentItem;
                        presets.savedNextCurrentItem = nextCurrentItem;
                    } else {
                        currentItem = presets.savedCurrentItem;
                        nextCurrentItem = presets.savedNextCurrentItem;
                        quiz.items = quiz.unfilteredItems;
                    }
                    if (settings.fpresets[selected].ask){
                        askQuestionsAndProceed(selected);
                    } else {
                        applyFiltersAndDisplay();
                    }
        });
    };

    var firstTemporaryFilter = true;
    function resetTemporaryFilters(){
        if (quiz.settings.active_fpreset !== 0){
            let presets = quiz.settings.tablePresets[quiz.settings.active_ipreset];
            firstTemporaryFilter = true;
            quiz.items = quiz.unfilteredItems;
            quiz.unfilteredItems = [];
            quiz.settings.active_fpreset = 0;
            presets.currentItem = currentItem = presets.savedCurrentItem;
            presets.nextCurrentItem = nextCurrentItem = presets.savedNextCurrentItem;
            $('#WkitFilterSelector').prop('selectedIndex', 0);
        }
    }

    function applyFiltersAndDisplay(){
        let settings = quiz.settings;
        let presets = settings.tablePresets[settings.active_ipreset];
        applyTemporaryFilter();
        presets.currentItem = currentItem = 0;
        presets.nextCurrentItem = nextCurrentItem = quiz.items.length;
        wkof.set_state(Wkit_navigation, 'Pending');
        wkof.Settings.save(scriptId).then(function(){wkof.set_state(Wkit_navigation, 'Ready')});
        displayItems();
        dataReady = true;
    };

    function askQuestionsAndProceed (selected){
        var filters_cfg = {};

        let filters = quiz.settings.fpresets[quiz.settings.active_fpreset].content.wk_items.filters
        let flt_content;
        for (var filterName in filters){
            let filter = filters[filterName];
            if (!filter.enabled) continue;
            let flt = wkof.ItemData.registry.sources.wk_items.filters[filterName];
            flt_content = getFilterInformation(flt);
            filters_cfg['fflt_'+filterName] = $.extend(true, {}, flt_content);
            filters_cfg['fflt_'+filterName].path = '@fpresets[@active_fpreset].content.wk_items.filters["'+filterName+'"].value';
        };

        let filterKeys = Object.keys(filters_cfg);
        if (filterKeys.length === 1 && filters_cfg[filterKeys[0]].callable_dialog){
            let filter_cfg = filters_cfg[filterKeys[0]];
            let config = {on_save: applyFiltersAndDisplay, on_cancel: cancelFiltering,
                          path: filter_cfg.path, script_id: scriptId,};
            filter_cfg.on_click('None', config, function(){return;});
        } else {
            var config = {
                script_id: scriptId,
                title: 'Type in Your Filtering Criteria.',
                on_save: applyFiltersAndDisplay,
                on_cancel: cancelFiltering,
                no_bkgd: true,
                settings: {grp_fpre_temp: {type:'group',label:'Selected Filters', content: filters_cfg},
                          },
            };
            let dialog = new wkof.Settings(config);
            dialog.open();
        };

        function cancelFiltering(){
            resetTemporaryFilters()
            wkof.set_state(Wkit_navigation, 'Pending');
            wkof.Settings.save(scriptId).then(function(){wkof.set_state(Wkit_navigation, 'Ready')});
            displayItems();
            dataReady = true;
        };

    };

    // utility function for setting the colors of the buttons
    function setSelectionButtonsColors(){
        let settings = quiz.settings;
        let presets = settings.tablePresets[settings.active_ipreset];
        let selection = presets.selection;
        if (selection === 'None'){
            if ($('#WkitRandomSelection').hasClass("WkitActive")) $('#WkitRandomSelection').toggleClass("WkitActive");
            if ($('#WkitDateOrdering').hasClass("WkitActive")) $('#WkitDateOrdering').toggleClass("WkitActive");
        } else if (selection === 'Random') {
            if (!$('#WkitRandomSelection').hasClass("WkitActive")) $('#WkitRandomSelection').toggleClass("WkitActive");
            if ($('#WkitDateOrdering').hasClass("WkitActive")) $('#WkitDateOrdering').toggleClass("WkitActive");
        }
    }

    // ==========================================================
    // End of Events Handlers and Navigation
    //-----------------------------------------------------------

    // ===========================================================
    // Functions to produce and display the content of the screen
    //------------------------------------------------------------

    //----------------------------------------------------------
    // functions to order the items and dispatch the data to the displaying function according to current mode

    function findSortOrder(){
        let settings = quiz.settings.tablePresets[quiz.settings.active_ipreset];
        let tableKey = settings.table_data;
        let sort1 = settings.sort1;
        let sort2 = settings.sort2;
        let sortKey, sortKey2;
        let sortOrder = settings.sortOrder1;
        let sortOrder2 = settings.sortOrder2;
        if ((sort1 == "Default") && (sort2 == 'Default')){
            sortKey = metadata[tableKey].sortkey;
            if (sortOrder === 'Default'){sortOrder = metadata[tableKey].sortOrder};
            sortKey2 = metadata[tableKey].sortkey2;
            if (sortOrder2 === 'Default'){sortOrder2 = metadata[tableKey].sortOrder2};
        } else if ((sort1 == "Default") && (sort2 != "Default")){
            sortKey = metadata[tableKey].sortkey;
            if (sortOrder === 'Default'){sortOrder = metadata[tableKey].sortOrder};
            sortKey2 = metadata[sort2].sortkey;
            if (sortOrder2 === 'Default'){sortOrder2 = metadata[sort2].sortOrder};
        } else if ((sort1 != "Default") && (sort2 == "Default")){
            sortKey = metadata[sort1].sortkey;
            if (sortOrder === 'Default'){sortOrder = metadata[sort1].sortOrder};
            sortKey2 = metadata[sort1].sortkey2;
            if (sortOrder2 === 'Default'){sortOrder2 = metadata[sort1].sortOrder2};
        } else {
            sortKey = metadata[sort1].sortkey;
            if (sortOrder === 'Default'){sortOrder = metadata[sort1].sortOrder};
            sortKey2 = metadata[sort2].sortkey;
            if (sortOrder === 'Default'){sortOrder2 = metadata[sort2].sortOrder};
        }
        return {sortKey: sortKey, sortKey2: sortKey2, sortOrder: sortOrder, sortOrder2: sortOrder2,};
    }

    function updatePage(noCreateTable) {
        let leechStreakLimit = quiz.settings.tablePresets[quiz.settings.active_ipreset].leechStreakLimit;
        if (leechStreakLimit != 0) {
            quiz.items = quiz.items.filter((item => {return ((item.review_statistics != undefined) ?
                                                             ((item.review_statistics.meaning_current_streak < (leechStreakLimit+1)) || (item.review_statistics.reading_current_streak < (leechStreakLimit+1))) : false)}));
        };

        let settings = quiz.settings.tablePresets[quiz.settings.active_ipreset];
        let sorting = findSortOrder();
        let sortKey = sorting.sortKey;
        let sortKey2 = sorting.sortKey2;
        let sortOrder = sorting.sortOrder;
        let sortOrder2 = sorting.sortOrder2;

        quiz.items.forEach(((item) => {item.sortKey = sortKey(item); item.sortKey2 = sortKey2(item)}));

        if ((sortOrder == 'Descending') && (sortOrder2 == 'Descending')){
            quiz.items = quiz.items.sort(function(a, b){return b.sortKey == a.sortKey ? b.sortKey2 - a.sortKey2 : b.sortKey - a.sortKey });
        } else if ((sortOrder == 'Descending') && (sortOrder2 == 'Ascending')){
            quiz.items = quiz.items.sort(function(a, b){return b.sortKey == a.sortKey ? a.sortKey2 - b.sortKey2 : b.sortKey - a.sortKey });
        } else if ((sortOrder == 'Ascending') && (sortOrder2 == 'Descending')){
            quiz.items = quiz.items.sort(function(a, b){return a.sortKey == b.sortKey ? b.sortKey2 - a.sortKey2 : a.sortKey - b.sortKey });
        } else {
            quiz.items = quiz.items.sort(function(a, b){return(a.sortKey == b.sortKey ? a.sortKey2 - b.sortKey2 : a.sortKey - b.sortKey)});
        };

        if (settings.selection === 'Random') {
            let result = retrieveSelecteditems(noCreateTable);
            if (!result) return Promise.resolve();
            wkof.set_state(Wkit_navigation, 'Pending');
            wkof.Settings.save(scriptId).then(function(){wkof.set_state(Wkit_navigation, 'Ready')});
            if (!noCreateTable){displayItems()};
        } else if (settings.selection === 'Date') {
            quiz.savedItems = quiz.items.slice(0, quiz.items.length);
            orderByDate(quiz.items);
            settings.currentItem = currentItem; // should be determined by order by date
            settings.nextCurrentItem = nextCurrentItem = currentItem;
            if ($('#WkitRandomSelection').hasClass("WkitActive")) $('#WkitRandomSelection').toggleClass("WkitActive");
            if (!$('#WkitDateOrdering').hasClass("WkitActive")) $('#WkitDateOrdering').toggleClass("WkitActive");
            wkof.set_state(Wkit_navigation, 'Pending')
            wkof.Settings.save(scriptId).then(function(){wkof.set_state(Wkit_navigation, 'Ready')})
            if (!noCreateTable){displayItems()};
        } else {
            if ($('#WkitRandomSelection').hasClass("WkitActive")) $('#WkitRandomSelection').toggleClass("WkitActive");
            if ($('#WkitDateOrdering').hasClass("WkitActive")) $('#WkitDateOrdering').toggleClass("WkitActive");
            currentItem = settings.currentItem || 0;
            nextCurrentItem = settings.nextCurrentItem || 0;
            if (settings.currentItem >= quiz.items.length){
                settings.currentItem = currentItem = 0;
                settings.nextCurrentItem = nextCurrentItem = 0;
            };
            if (!noCreateTable){displayItems()};
        };
    };

    function displayItems(){
        if (quiz.settings.listMode){
            createItemList(quiz.items, false);
        } else {
            createTopLeechTables(quiz.items);
        };
    };

    const waitMessage = '<div class="emptyMessage"><p id="WkitWaitMessage"><b>Item Inspector is loading the data<b></p></div>'
    function dataReload(fetchOption){
        $('#leech_table').html = waitMessage;
        switch (fetchOption){
            case 'export':
                filter_items_for_table();
                updatePage(true);
                temporaryFilter();
                performExport();
                break;
            case 'wordCloud':
                filter_items_for_table();
                updatePage(true);
                temporaryFilter();
                performWordCloud();
                break;
            case 'table':
            default:
                filter_items_for_table();
                updatePage(true);
                temporaryFilter();
                displayItems();
                break;
        };

        function temporaryFilter(){
            quiz.unfilteredItems = quiz.items;
            if (quiz.settings.active_fpreset !== 0) applyTemporaryFilter();
        }
    }

    //=================================================================
    // HTML generation
    //
    // A decision has been made to generate the html as a long string
    // for performance reasons. The html for a screen full of icons is huge
    // The overhead must be kept at a minimum because there is a lot of
    // latency to display a screen when navigating or changing mode.
    // The overhead of DOM manipulation is too expensive because of the
    // high volume of manipulations.
    //
    // String concatenation has too much overhead because strings copy is
    // required for concatenation to happen. The copy algorithm for repeated
    // concatenation is quadratic. This is unsustainable with the high volume
    // of copies required.
    //
    // Strings are pushed on an array called stringList. All functions that
    // generate html take stringList as a parameter and pushes strings to it.
    // At the end strigList.join('') produces the final html. This results in
    // a much more efficient linear algorithm to produce the html.
    //
    // The inline SVG for radicals must be inserted in the mouseover area
    // set to display a popup before the div holding the popup contents.
    // Otherwise a bug in Chrome and Firefox (as of November 2010) causes some
    // stroke to become invisible when the popup goes invisible even though
    // they are not part of the popup.

    //----------------------------------------------------------
    // Helper functions to produce the popups

    // Popups are expensive. Generating the html and processing the resulting DOM elements
    // is a big source of latency. To avoid this latency generation of this html and its insertion into the DOM
    // is delayed until mouseenter on the parent occurs. An event handler on the parent take care of this.

    function makeMoreIconsPopup(id, stringList){
        let itemList = subjectIndex[parseInt(id)].data.amalgamation_subject_ids; // more icons indicators never occur for components or visually similar
        itemList.forEach(function(id){makeIconForTooltip(subjectIndex[id], stringList)});
    }

    // event handler for making the more icons popup
    function insertAddMorePopup(e){
        let $e = $(e.currentTarget);
        if ($e.children().children().length !== 0) return; // html already there
        let id = $e.attr('subjectid');
        let stringList = [];
        makeMoreIconsPopup(id, stringList);
        let $popup = $e.children(".WkitAndMorePopup");
        $popup.empty().html(stringList.join(''));
        $popup.find(".WkitMiniIcon").mouseover(insertPopup);
    }


    var miniToolTipEntries = ['Meaning_Brief', 'Reading_Brief', 'Level', 'Srs', 'Leech', 'JLPT'];
    function makePopupForIcon(id, stringList){
        let item = subjectIndex[parseInt(id)];
        var info = {
            type: item.object,
            characters: item.data.characters,
            url: item.data.document_url,
            svg: (item.data.characters === null ? svgForRadicals[item.id] : null),
        };
        stringList.push('<div class="left">');
        pushCharactersForItem(info, stringList);
        stringList.push('</div>');
        stringList.push('<div class="right"><table class="WkitTablePopup"><tbody>');

        miniToolTipEntries.forEach(function (tableName){makeTooltipEntry(item, tableName, stringList)});

        stringList.push('</tbody></table>');
        stringList.push('</div>');
    }

    // event handler for making the mini icon popup
    function insertPopup(e){
        let $e = $(e.currentTarget);
        if ($e.children('.WkitIconTooltipContent').children().length !== 0) return; // html already there
        let id = $e.attr('subjectid');
        let stringList = [];
        makePopupForIcon(id, stringList);
        $e.children(".WkitIconTooltipContent").empty().html(stringList.join(''));
    }

    function makeIconForTooltip(item, stringList){
        let itemData;
        if(item.data.characters!= null) {
            itemData = item.data.characters;
        } else if (item.data.character_images!= null){
            itemData = svgForRadicals[item.id];
        } else {
            //if both characters and character_images are somehow absent try using slug instead
            itemData = item.data.slug;
        }
        stringList.push('<div class="WkitMiniIcon ');
        stringList.push(item.object);
        stringList.push('" subjectid="');
        stringList.push(item.id.toString());
        stringList.push('">');
        stringList.push('<a href="');
        stringList.push(item.data.document_url);
        stringList.push('" target="_blank">');
        stringList.push('<span class="WkitMiniIconLink" style="color: ');
            stringList.push(fontColor);
            stringList.push(' !important;" lang="JP">');
            stringList.push(itemData);
        stringList.push('</span>');
        stringList.push('</a>');
        stringList.push('<div class="WkitIconTooltipContent">');
        stringList.push('</div>');
        stringList.push('</div>');
        return stringList;
    };

    function makeTooltipIcon(item, tableName, id, stringList){
        let tableData = metadata[tableName];
        if (tableData.exists(item)) {
            let iconLimit = 31; //(quiz.settings.listMode ? 15 : 40);
            let overhead = 0.8;
            let itemList = tableData.itemList(item);
            let itemListShort = [];
            let charCount = 0;
            let index = 0;
            while (charCount < iconLimit && index < itemList.length){
                let item2 = itemList[index];
                itemListShort.push(item2);
                charCount += (item2.data.characters != null ? item2.data.characters.length : 1) + overhead;
                index++;
            };
            stringList.push('<tr><td class="WkitLabel">');
            stringList.push(tableData.label);
            stringList.push('</td><td class="WkitTipValue">');
            stringList.push('<div class="WkitMiniContainer">');
            itemListShort.forEach(a=>{makeIconForTooltip(a, stringList)});
            if (charCount >= iconLimit){
                stringList.push('<div class="WkitAndMore" subjectid="');
                stringList.push(id.toString());
                stringList.push('">');
                stringList.push('<div class="WkitAndMorePopup">');
                stringList.push('</div>');
                stringList.push('<span class="WkitIconWarning">And more</span>');
                stringList.push('</div>');
            }
            stringList.push('</div></td></tr>');
        };
    };

    const notesLabel = {meaning_note: 'Meaning Note', reading_note: 'Reading Note', meaning_synonyms: 'Synonyms', };
    function makePopupNotes(item, element, stringList){
        if (!item.study_materials || !item.study_materials[element]  || (element === 'meaning_synonyms' && item.study_materials[element].length === 0)) return false;
        stringList.push('<div class="WkitMnemonic">');
        stringList.push('<div class="WkitMnemonicPopup">');
        stringList.push('<p>');
        if (element !== 'meaning_synonyms'){
            stringList.push(item.study_materials[element]);
        } else {
            stringList.push(item.study_materials[element].join(', '));
        };
        stringList.push('</p>');
        stringList.push('</div>');
        stringList.push('<span>');
        stringList.push(notesLabel[element]);
        stringList.push('</span>');
        stringList.push('</div>');
        return true;
    }

    const mnemonicsLabel = {meaning_mnemonic: 'Meaning Mnemonic', meaning_hint: 'Meaning Hint', reading_mnemonic: 'Reading Mnemonic', reading_hint: 'Reading Hint', };
    function makePopupMnemonics(item, element, stringList){
        if (!item.data[element]) return;
        stringList.push('<div class="WkitMnemonic">');
        stringList.push('<div class="WkitMnemonicPopup">');
        stringList.push('<p>');
        stringList.push(item.data[element]);
        stringList.push('</p>');
        stringList.push('</div>');
        stringList.push('<span>');
        stringList.push(mnemonicsLabel[element]);
        stringList.push('</span>');
        stringList.push('</div>');
    };

    function makeContextSentences(item, stringList){
        if (!item.data.context_sentences) return;
        stringList.push('<div class="WkitMnemonic">');
        stringList.push('<div class="WkitMnemonicPopup">');
        for (let sentences of item.data.context_sentences){
            stringList.push('<p>');
            stringList.push(sentences.ja);
            stringList.push('</p>');
            stringList.push('<p>');
            stringList.push(sentences.en);
            stringList.push('</p>');
        };
        stringList.push();
        stringList.push('</div>');
        stringList.push('<span>');
        stringList.push('Context Sentences');
        stringList.push('</span>');
        stringList.push('</div>');
    };

    function itemsCharacterCallback (item, override){
        let maxItemLength = 28;
        if (quiz.settings.tablePresets[quiz.settings.active_ipreset].displayMeaning && !override){
            let text = meaningsBrief(item);
            if (wideElements[quiz.settings.tablePresets[quiz.settings.active_ipreset].table_data]){
                return [text.slice(0,maxItemLength), false , ''];
            } else {
                return [text, false, ''];
            };
        };
        //check if an item has characters. Kanji and vocabulary will always have these but wk-specific radicals (e.g. gun, leaf, stick) use images instead
        if(item.data.characters!= null) {
            return [item.data.characters, true, 'lang="JP"'];
        } else if (item.data.character_images!= null){
            return [svgForRadicals[item.id], true, 'lang="JP"'];
        } else {
            //if both characters and character_images are somehow absent try using slug instead
            return [item.data.slug, true, 'lang="JP"'];
        };
    };

    function makeTableEntry(item, selectedTable){
        let presets = quiz.settings.tablePresets[selectedTable];
        let tableData;
        if (presets.selection === "Date"){
            tableData = metadata[presets.navigationDate];
        } else {
            tableData = metadata[presets.table_data];
        };
        return (tableData.exists(item) ? tableData.tableEntry(item) : '')
    }

    function makeTooltipEntry(item, tableName, stringList){
        let tableData = metadata[tableName];
        if (tableData.exists(item)) {
            stringList.push('<tr><td class="WkitLabel">');
            stringList.push(tableData.label);
            stringList.push('</td><td class="WkitTipValue">');
            stringList.push(tableData.tooltipEntry(item));
            stringList.push('</td></tr>');
        };
    };

    function makeMnemonicsEntry(item, stringList){
        stringList.push('<tr><td class="WkitLabel">');
        stringList.push('Mnemonics');
        stringList.push('</td><td class="WkitMnemonicContainer">');
        makePopupMnemonics(item, 'meaning_mnemonic', stringList);
        makePopupMnemonics(item, 'meaning_hint', stringList);
        makePopupMnemonics(item, 'reading_mnemonic', stringList);
        makePopupMnemonics(item, 'reading_hint', stringList);
        makeContextSentences(item, stringList);
        stringList.push('</td></tr>');
    };

    function makeNotesEntry(item, stringList){
        stringList.push('<tr><td class="WkitLabel">');
        stringList.push('Notes');
        stringList.push('</td><td class="WkitMnemonicContainer">');
        let work = makePopupNotes(item, 'meaning_note', stringList);
        let someDone = work;
        work = makePopupNotes(item, 'reading_note', stringList);
        someDone = someDone || work;
        work = makePopupNotes(item, 'meaning_synonyms', stringList);
        someDone = someDone || work;
        if (!someDone){
            stringList.push('<div class="WkitMnemonic">');
            stringList.push('<span>');
            stringList.push('No notes or synonyms');
            stringList.push('</span>');
            stringList.push('</div>');
        }
        stringList.push('</td></tr>');
    };

    var audioCounter = 0;
    function makeItemLink(item, itemData, itemClass, audioOk){
        let stringList = [];
        if (quiz.settings.audioMode && item.object === 'vocabulary' && audioOk){
            let gender = quiz.settings.audioSource;
            let audioId = 'Wkitaudio'+audioCounter; audioCounter++;

            if (gender == 'male' || gender == 'random'){
                let soundUrlmpeg = item.data.pronunciation_audios.find(a=>a.content_type=="audio/mpeg"&&a.metadata.gender==='male');
                if (soundUrlmpeg != undefined){soundUrlmpeg = soundUrlmpeg.url};
                let soundUrlogg = item.data.pronunciation_audios.find(a=>a.content_type=="audio/ogg"&&a.metadata.gender==='male');
                if (soundUrlogg != undefined){soundUrlogg = soundUrlogg.url};
                if (soundUrlmpeg != undefined && soundUrlogg != undefined){
                    if(soundUrlogg != undefined) stringList.push('<link ref="prefetch" href="'+soundUrlogg+'">');
                    if(soundUrlmpeg != undefined) stringList.push('<link ref="prefetch" href="'+soundUrlmpeg+'">');
                    stringList.push('<audio id="'+audioId+'male">');
                    if(soundUrlogg != undefined) stringList.push('<source src="'+soundUrlogg+'" type="audio/ogg"></source>');
                    if(soundUrlmpeg != undefined) stringList.push('<source src="'+soundUrlmpeg+'" type="audio/mpeg"></source>');
                    stringList.push('</audio>');
                }
            };

            if (gender == 'female' || gender == 'random'){
                let soundUrlmpeg = item.data.pronunciation_audios.find(a=>a.content_type=="audio/mpeg"&&a.metadata.gender==='female');
                if (soundUrlmpeg != undefined){soundUrlmpeg = soundUrlmpeg.url};
                let soundUrlogg = item.data.pronunciation_audios.find(a=>a.content_type=="audio/ogg"&&a.metadata.gender==='female');
                if (soundUrlogg != undefined){soundUrlogg = soundUrlogg.url};
                if (soundUrlmpeg != undefined && soundUrlogg != undefined){
                    if(soundUrlogg != undefined) stringList.push('<link ref="prefetch" href="'+soundUrlogg+'">');
                    if(soundUrlmpeg != undefined) stringList.push('<link ref="prefetch" href="'+soundUrlmpeg+'">');
                    stringList.push('<audio id="'+audioId+'female">');
                    if(soundUrlogg != undefined) stringList.push('<source src="'+soundUrlogg+'" type="audio/ogg"></source>');
                    if(soundUrlmpeg != undefined) stringList.push('<source src="'+soundUrlmpeg+'" type="audio/mpeg"></source>');
                    stringList.push('</audio>');
                }
            };

            stringList.push('<a onclick="playAudio(\''+audioId+"','"+gender+'\');">');
            stringList.push('<span '+itemClass+'>'+itemData[0]+'</span>');
            stringList.push('</a>');
            return stringList.join('');
        } else {
            stringList.push('<a style="padding-right:0;" target="_blank" href="');
            stringList.push(item.data.document_url);
            stringList.push('"><span ');
            stringList.push(itemClass);
            stringList.push('>');
            stringList.push(itemData[0]);
            stringList.push('</span></a>');
            return stringList.join('');
        };
    };

    function makeGraphicalElement(item, selectedTable, stringList){
        let presets = quiz.settings.tablePresets[selectedTable]
        var info = {
            type: item.object,
            characters: item.data.characters,
            url: item.data.document_url,
            svg: (item.data.characters === null ? svgForRadicals[item.id] : null),
        };

        let visualInfoFormat = 'itemOnly';
        let strokeOrderPopup = presets.showStrokeOrder;
        let pitchInfoDiagrams, message, keiseiIconsList;
        switch (item.object) {
            case ('radical'):
                if (presets.showRadical === 'Keisei') {
                    keiseiIconsList = makeKeiseiIconsRad(item.data.slug);
                    if (typeof keiseiIconsList === 'string'){
                        visualInfoFormat = 'message';
                        message = keiseiIconsList;
                    } else {
                        visualInfoFormat = 'keisei';
                    };
                };
                break;
            case ('kanji'):
                if (presets.showKanji === 'Stroke Order'){
                    visualInfoFormat = 'strokeOrder';
                } else if (presets.showKanji === 'Keisei') {
                    keiseiIconsList = makeKeiseiIconsKan(item.data.slug);
                    if (typeof keiseiIconsList === 'string'){
                        visualInfoFormat = 'message';
                        message = keiseiIconsList;
                    } else {
                        visualInfoFormat = 'keisei';
                    };
                };
                break;
            case ('vocabulary'):
                if (presets.showVocabulary === 'Pitch Info'){
                    pitchInfoDiagrams = getPitchInfoDiagram(item);
                    if (pitchInfoDiagrams.length > 0) visualInfoFormat = 'pitchInfo';
                }
                break;
        }

        switch (visualInfoFormat){
            case 'itemOnly':
                stringList.push('<div class="left WkitStrokeOrderHover">');
                if (strokeOrderPopup) pushPopupStrokeOrder();
                pushCharactersForItem(info, stringList);
                stringList.push('</div>');
                break;
            case 'message':
                stringList.push('<div class="left">');
                stringList.push('<div class="WkitMessageContainer">');
                stringList.push('<div class="WkitCharacters WkitStrokeOrderHover ');
                stringList.push(item.object);
                stringList.push('">');
                if (strokeOrderPopup) pushPopupStrokeOrder();
                pushCharactersForItem(info, stringList);
                stringList.push('</div>');
                stringList.push('<div class="WkitMessage">');
                stringList.push(message);
                stringList.push('</div>');
                stringList.push('</div>');
                stringList.push('</div>');
                break;
            case 'pitchInfo':
                stringList.push('<div class="left WkitPitchInfoContainer">');
                stringList.push('<div class="WkitPitchInfo">');
                stringList.push('<div class="WkitFirstPitchInfo">');
                stringList.push(pitchInfoDiagrams[0].pitchDiagrams);
                stringList.push('</div>');
                stringList.push('<div class="WkitPitchInfoReading">');
                stringList.push(readingsBrief(item));
                stringList.push('</div>');
                stringList.push('</div>');
                stringList.push('<div class="WkitCharactersPitch WkitStrokeOrderHover">');
                if (strokeOrderPopup) pushPopupStrokeOrder();
                pushCharactersForItem(info, stringList);
                stringList.push('</div>');
                stringList.push('</div>');
                break;
            case 'keisei':
                stringList.push('<div class="left WkitVisualDataContainer">');
                for (let keiseiIcons of keiseiIconsList){
                    stringList.push('<div class="WkitBaseDataList">');
                    stringList.push('<div class="WkitItemForKeisei WkitStrokeOrderHover">');
                    if (strokeOrderPopup) pushPopupStrokeOrder();
                    if (item.object === 'radical') {
                        stringList.push('<div class="keiseiRad keiseiItem">');
                        stringList.push('<span class="keiseiLarge">');
                        if (info.characters === null){
                            stringList.push(info.svg);
                        } else {
                            stringList.push(info.characters);
                        };
                        stringList.push('</span>');
                        stringList.push('<span class="keiseiText">');
                        stringList.push('&nbsp;');
                        stringList.push('</span>');
                        stringList.push('<span class="keiseiText">');
                        stringList.push(meaningsBrief(item));
                        stringList.push('</span>');
                        stringList.push('</div>');
                    } else {
                        stringList.push(keiseiIcons.main);
                    }
                    stringList.push('</div>');
                    stringList.push('<div class="WkitBaseData">');
                    stringList.push(keiseiIcons.base.html);
                    if (keiseiIcons.base.explanation !== ''){
                        stringList.push('<div class="keiseiExplanations">');
                        stringList.push(keiseiIcons.base.explanation);
                        stringList.push('</div>');
                    };
                    stringList.push('</div>');
                    stringList.push('<div class="WkitCompoundData">');
                    stringList.push(keiseiIcons.compounds.html);
                    if (keiseiIcons.compounds.explanation !== ''){
                        stringList.push('<div class="keiseiExplanations">');
                        stringList.push(keiseiIcons.compounds.explanation);
                        stringList.push('</div>');
                    };
                    stringList.push('</div>');
                    stringList.push('</div>');
                }
                stringList.push('</div>');
                break;
            case 'strokeOrder':
                stringList.push('<div class="left WkitVisualDataContainer">');
                stringList.push('<div class="WkitBaseDataList">');
                stringList.push('<div class="WkitCharactersStrokeOrder WkitStrokeOrderHover">');
                if (strokeOrderPopup) pushPopupStrokeOrder();
                pushCharactersForItem(info, stringList);
                stringList.push('</div>');
                stringList.push('<div class="WkitStrokeOrderImage">');
                pushStrokeOrderImage();
                stringList.push('</div>');
                stringList.push('</div>');
                stringList.push('</div>');
                break;
        };

        function pushPopupStrokeOrder(){
            if (item.data.characters === null) return;
            stringList.push('<div class="WkitStrokeOrderPopup ');
            stringList.push(info.type);
            stringList.push('"><span class="');
            stringList.push(info.type);
            stringList.push('" style="color: ');
            stringList.push(fontColor)
            stringList.push(' !important;">');
            stringList.push(info.characters);
            stringList.push('</span>');
            stringList.push('</div>');
        };

        function pushStrokeOrderImage(){
            stringList.push(strokeOrderSvgImages[item.data.characters]);
        };
    };

    function pushCharactersForItem(info, stringList){
        stringList.push('<span class="');
        stringList.push(info.type);
        stringList.push('" style="color: ');
        stringList.push(fontColor)
        stringList.push(' !important;">');
        if (info.characters === null){
            stringList.push(info.svg);
        } else {
            stringList.push(info.characters);
        };
        stringList.push('</span>');
    }

    // Another function for making a popup that is delayed until mouse over
    function makeTooltips(item, selectedTable, mode){
        let presets = quiz.settings.tablePresets[selectedTable]
        let selection = presets.selection;
        let makeTableButton = '';
        //if (iconEntries.length != 0) makeTableButton = '<button class="WkitMiniButton" SubjectId="'+item.id+'">Make Table</button>';

        let stringList = [];
        makeGraphicalElement(item, selectedTable, stringList);
        stringList.push('<div class="right"><table class="WkitTablePopup"><tbody>');

        iconEntries.forEach(function (tableName) {makeTooltipIcon(item, tableName, item.id, stringList)});
        toolTipEntries.forEach(function (tableName){makeTooltipEntry(item, tableName, stringList)});

        if (mode === 'list') makeTooltipEntry(item, presets.table_data, stringList);
        if (mode === 'table' && selection == 'Date') makeTooltipEntry(item, presets.table_data, stringList);
        if (mode === 'list' && selection == 'Date') makeTooltipEntry(item, presets.navigationDate, stringList);
        if (needMnemonics) makeMnemonicsEntry(item, stringList);
        if (needNotes) makeNotesEntry(item, stringList);

        stringList.push('</tbody></table>');
        //stringList.push(makeTableButton);
        stringList.push('</div>');

        return stringList.join('');
    }

    function insertTooltip(e){
        let $e = $(e.currentTarget);
        // don't generate html that is already there
        // the ::after element is always there, so the test of emptiness is for one element
        if ($e.children().children().length !== 1) return;
        let id = $e.attr('subjectid');
        let item = subjectIndex[parseInt(id)];
        let selected_table = quiz.settings.active_ipreset;
        let html = makeTooltips(item, selected_table, this);
        $e.children('.WkitTooltipContent').empty().html(html);
        $e.find(".WkitMiniIcon").mouseenter(insertPopup);
        $e.find(".WkitAndMore").mouseenter(insertAddMorePopup);
    }

    // Produces arrays of entries required for the creation of a popup
    var toolTipEntries;
    var iconEntries;
    var needMnemonics;
    var needNotes;
    function initTooltipGlobals(){
        let presets = quiz.settings.tablePresets[quiz.settings.active_ipreset];
        toolTipEntries = [];
        iconEntries = [];
        needMnemonics = false;
        needNotes = false;
        let tableNames = ['tooltip1', 'tooltip2', 'tooltip3', 'tooltip4', 'tooltip5', 'tooltip6', 'tooltip7', 'tooltip8', ];
        let entriesWithIcons = {'Vis_Sim_Kanji': true, 'Components': true, 'Used_In': true, 'Lars_Yencken': true, };
        tableNames.forEach(processName);

        function processName(name){
            let preset = presets[name];
            if (preset !== 'None'){
                if (entriesWithIcons[preset]){
                    iconEntries.push(preset);
                } else if (preset === 'Mnemonics'){
                    needMnemonics = true;
                } else if (preset === 'Notes'){
                    needNotes = true;
                } else {
                    toolTipEntries.push(preset);
                };
            };
        };
    };

    function makeEnlargingTooltip (item, selectedTable){
        let html;
        if (quiz.settings.tablePresets[selectedTable].enlargingTooltip === true){
            let stringList = ['<div class="WkitEnlargedTooltip">'];
            stringList.push('<span class="');
            stringList.push(item.object);
            stringList.push('" style="color: ');
            stringList.push(fontColor);
            stringList.push(' !important;">');
            stringList.push((item.data.characters === null ? svgForRadicals[item.id] : item.data.characters));
            stringList.push('</span></div>');
            html = stringList.join('');
        } else {
            html = '';
        };
        return html;
    };

    //----------------------------------------------------------
    // End of helper functions to produce the popups

    //----------------------------------------------------------
    // Functions to produce the html for the items and display it

    var script = '<script type="text/javascript">'
    script += 'function playAudio(id, gender){';
    script +=      'if (gender === "random"){gender = ["male", "female"][Math.floor(Math.random()*2)]};'
    script +=      'id += gender;';
    script +=      'document.getElementById(id).play();';
    script += '};';
    script += '</script>';
    var $script = $(script);

    const numberOfTables = 3;
    var itemPer;
    var nbDisplayedItems;
    var sizeOfList;
    var sizeOfTable;
    var numberPerTable;
    function setNumberOfLines (){
        if (quiz.settings.numberOfLines === undefined){
            numberPerTable = 11;
        } else {
            numberPerTable = Number(quiz.settings.numberOfLines);
        };
        sizeOfTable = numberOfTables * numberPerTable;
        sizeOfList = 115;
        if (quiz.settings.listMode){nbDisplayedItems = sizeOfList} else {nbDisplayedItems = sizeOfTable};
    };

    const emptyMessage = `<div class="emptyMessage"><p><b>No items match your criteria. You may try relaxing them if possible.</b></p></div>`;

    // displaying items in table mode
    function createTopLeechTables(items) {
        let startnumberTable = currentItem;
        let endNumberTable = currentItem + numberPerTable;
        let itemsLength = items.length;
        let nrOfTables = numberOfTables;
        let totalNumberOfLeeches = numberPerTable * nrOfTables;
        let meanings = "";
        let readings = "";
        audioCounter = 0;
        let activeTable = quiz.settings.active_ipreset;
        initTooltipGlobals();
        let elemenentsList = [];

        //make sure we don't create empty tables if there are too few items
        if(items.length == 0){
            nrOfTables = 0;
            elemenentsList.push($(emptyMessage));
        } else if(items.length < totalNumberOfLeeches) { //if less leeches available then user requested
            var ratio = items.length / (numberPerTable*3);
            if(ratio <= 0.34){
                nrOfTables = 1;
            } else if(ratio <= 0.67){
                nrOfTables = 2;
            }
        } else if (numberPerTable >= totalNumberOfLeeches){ //if table capacity greater than user's requested amount of leeches
            nrOfTables = 1;
        }

        //Create tables
        if (quiz.settings.audioMode) elemenentsList.push($script);
        for (var i = 0; i < nrOfTables; i++){
            //In case there are less than the requested amount of items
            if(items.length <= endNumberTable){
                endNumberTable = items.length;
                nrOfTables = i - 1;
            };
            let $tableColumn = $('<div class="span4" style="width=290px;"></div>');
            let $currentElement = $tableColumn;
            let $tempElement = $('<div class="WkitTableList" style="position: relative;"></div>');
            $currentElement.append($tempElement);
            $currentElement = $tempElement;
            $tempElement = $('<table></table>');
            $currentElement.append($('<h3 class="WkitSmallCaps">Items '+(startnumberTable+1)+'-'+endNumberTable+' of '+itemsLength+'</h3>'), $tempElement);
            $currentElement = $tempElement;
            let $tbody = $('<tbody></tbody>');
            $currentElement.append($tbody);
            let stringList = [];
            for (var j = startnumberTable; j < endNumberTable; j++){
                let item = items[j];
                let itemData = itemsCharacterCallback(items[j], false);
                let tableEntry = makeTableEntry(items[j], activeTable);
                let itemLink = makeItemLink(items[j], itemData, 'class="WkitMainElement WkitItem'+itemData[2]+'" style="color: '+fontColor+' !important"', true);
                let addClass = (j <= startnumberTable + 2 ? 'WkitFirstItem' : 'WkitLaterItem');
                addClass += (i !== 2 ? ' WkitLeftItem' : ' WkitRightItem');
                let tooltip2;
                if (itemData[1]){
                    tooltip2 = '<div class="WkitTooltip2"><p><span> </span></p>'+makeEnlargingTooltip(items[j], activeTable)+'</div>';
                } else {
                    tooltip2 = '';
                };
                stringList.push('<tr class="');
                    stringList.push(item.object);
                    stringList.push('">');
                    stringList.push('<td>');
                        stringList.push('<div class="WkitTooltip ');
                        stringList.push(addClass);
                        stringList.push('" subjectid="');
                        stringList.push(item.id.toString());
                        stringList.push('">');
                            stringList.push(itemLink);
                            stringList.push('<div class="WkitTooltipContent"></div>');
                            stringList.push('</div>');
                        stringList.push('</div>');
                        stringList.push(tooltip2);
                    stringList.push('</td>');
                    stringList.push('<td>');
                        stringList.push('<div style="text-align: right">');
                            stringList.push('<a class="WkitMainElement" style="padding-left:0;">');
                                stringList.push('<span style="color: ');
                                stringList.push(secondaryFontColor);
                                stringList.push(' !important">');
                                    stringList.push(tableEntry);
                                stringList.push('</span>');
                            stringList.push('</a>');
                        stringList.push('</div>');
                    stringList.push('</td>');
                stringList.push('</tr>');
            }
            $tbody.append($(stringList.join('')));
            //preparing for next table
            startnumberTable += numberPerTable;
            endNumberTable += numberPerTable;
            elemenentsList.push($tableColumn);
        }

        nextCurrentItem = Math.min(j, items.length);
        // replace existing table
        let $leech_table = $('#leech_table').empty();
        elemenentsList.forEach(elem=>$leech_table.append(elem))
        $("#WkitTopBar").find(".WkitMiniIcon").mouseenter(insertPopup);
        $("#WkitTopBar").find(".WkitAndMore").mouseenter(insertAddMorePopup);
        $("#WkitTopBar").find(".WkitTooltip").mouseenter(insertTooltip.bind('table'));
    }

    // displaying items in icon list mode
    var direction = 'Forward';
    function createItemList(items, noDisplay){
        let startNumberItem = currentItem;
        if (items === undefined) console.trace();
        let itemsLength = items.length;
        let selected_table = quiz.settings.active_ipreset;
        let presets = quiz.settings.tablePresets[selected_table]
        let meaningMode = presets.displayMeaning;
        let get_table_data = metadata[presets.table_data].tableEntryMarker;
        let showMarkers = presets.showMarkers;
        if (presets.selection === 'Random') showMarkers = false;
        if (presets.selection === 'Date') showMarkers = presets.showMarkersDate;
        let dateSelection = (presets.selection === 'Date');
        let dateSelected = presets.navigationDate;
        if (dateSelection) get_table_data = metadata[dateSelected].tableEntryMarker;
        audioCounter = 0;
        initTooltipGlobals();

        // These variables control how many items will be on the screen so they don't overflow it
        // The numbers have been found by trial and error
        // Priotity no 1 - never force people to scroll to see the last item
        // As long as people never scroll fill the screen with as many icons as possible
        // Test on as a wide data set as possible and tweak the numbers until a good result is achieved
        // The tests must include all use cases
        // -- When only vocab are displayed
        // -- When only kanji/radicals are displayed
        // -- When a mixture of vocab, kanji and radicals are displayed
        // -- When there is a very high density of large markers
        // -- When there is an average amount of normal size markers
        // -- When there is no markers
        // -- Navigate through all items in WK to detect exceptional situations
        // -- If an item spills off the screen tweak a variable until this doesn't occur
        // Any change to the size of the icons requires to redo this tuning

        let firstLineLimit = meaningMode ? 120.0 : 70.0; // insert class to left justify when fewer characters than this
        let maxCharCount = meaningMode ? 550.0 : 333.0; // maximum characters in a screen - stop filling the screen when exceeded
        let overheadVocab = 0.9; // overhead for space between icons - for vocab
        let overheadOther = 0.8; // overhead for space between icons - for kanji and radicals
        let markerFactor = 0.37; // factor for smaller size of markers characters
        let markerOverhead = 1.5; // overhead for space between icons - for markers
        let meaningFactor = 0.27; // factor for smaller size of characters - for icons in meaning mode
        let meaningOverhead = 0.9; // factor for space between icons - for icons in meaning mode
        // end of screen control variables

        let htmlList = ['']; // reserve element 0 for the summary marker
        let charCount = 0;
        let oldMarker = undefined;
        let newMarker = undefined;
        let markerString;

        if (direction === 'Forward'){
            let i = currentItem;
            let endNumberItem = items.length - 1;
            while (charCount < maxCharCount && i <= endNumberItem){
                processItem(i);
                i++;
            }
            nextCurrentItem = i;
            htmlList[0] = `<div class="WkitSmallCapsList${meaningMode ? ' WkitMeaning' : ' WkitReading'}"><span>Items ${startNumberItem + 1}-${i} of ${itemsLength}</span></div>`;
        } else {
            let i = currentItem -1;
            while (charCount < maxCharCount && i >= 0){
                calculateCount(i);
                i--;
            };
            charCount = 0;
            oldMarker = undefined;
            newMarker = undefined;
            i = i + 1; // the last i was not processed
            currentItem = i;
            let j = i;
            if (i > 0){
                while (j < startNumberItem){
                    processItem(j);
                    j++;
                };
                htmlList[0] = `<div class="WkitSmallCapsList${meaningMode ? ' WkitMeaning' : ' WkitReading'}"><span>Items ${i+1}-${startNumberItem} of ${itemsLength}</span></div>`;
            } else {
                // i is 0. We have to fill the whole table - relying on startnumber would display too few items.
                let endNumberItem = items.length - 1;
                while (charCount < maxCharCount && i <= endNumberItem){
                    processItem(i);
                    i++;
                };
                nextCurrentItem = i;
                htmlList[0] = `<div class="WkitSmallCapsList${meaningMode ? ' WkitMeaning' : ' WkitReading'}"><span>Items ${1}-${i} of ${itemsLength}</span></div>`;
            };
        };

        let $mainElement;
        if (items.length === 0){
            $mainElement = $(emptyMessage);
        } else {
            $mainElement = $('<div class="WkitItemList '+(charCount < firstLineLimit ? 'WkitFlexLeft' : 'WkitFlexJustified')+'"></div>');
            $mainElement.append($(htmlList.join('')));
        };
        if (!noDisplay){
            let $leech_table = $('#leech_table').empty();
            if (items.length !== 0 && quiz.settings.audioMode) $leech_table.append($(script));
            $leech_table.append($mainElement);
            $("#WkitTopBar").find(".WkitTooltip.WkitTooltipIcon").each(addClassesForPosition);
            $("#WkitTopBar").find(".WkitTooltip.WkitTooltipIconMeaning").each(addClassesForPosition);
            $("#WkitTopBar").find(".WkitTooltip:not(.WkitMarker):not(.WkitMarkerMeaning)").mouseenter(insertTooltip.bind('list'));
        }

        function processItem(i){
            newMarker = get_table_data(items[i]);
            if (newMarker !== oldMarker){
                oldMarker = newMarker;
                if (showMarkers && newMarker !== ''){
                    makeMarkerElement(newMarker, meaningMode, htmlList);
                    markerString = (typeof newMarker === 'number' ? newMarker.toString() : newMarker);
                    charCount += (markerString.length * markerFactor) + markerOverhead;
                };
            };
            if (meaningMode){
                let meaning = metadata.Meaning_Brief.tableEntry(items[i]);
                makeListElement(items[i], selected_table, charCount, 'WkitTooltipIconMeaning', htmlList);
                charCount += meaning.length * meaningFactor + meaningOverhead;
            } else {
                makeListElement(items[i], selected_table, charCount, 'WkitTooltipIcon', htmlList);
                charCount += (items[i].data.characters === undefined || items[i].data.characters === null ? 1 + overheadOther : (items[i].data.characters.length === 1 ? 1 + overheadOther : items[i].data.characters.length + overheadVocab));
            };
        }

        function calculateCount(i){
            newMarker = get_table_data(items[i]);
            if (newMarker != oldMarker){
                oldMarker = newMarker;
                if (showMarkers && newMarker != ''){
                    markerString = (typeof newMarker === 'number' ? newMarker.toString() : newMarker);
                    charCount += (markerString.length * markerFactor) + markerOverhead;
                };
            };
            if (meaningMode){
                let meaning = metadata.Meaning_Brief.tableEntry(items[i]);
                charCount += meaning.length * meaningFactor + meaningOverhead;
            } else {
                charCount += (items[i].data.characters === undefined || items[i].data.characters === null ? 1 + overheadOther : (items[i].data.characters.length === 1 ? 1 + overheadOther : items[i].data.characters.length + overheadVocab));
            };
        }

        function makeListElement(item, selected_table, charCount, itemClass, stringList){
            let stringList2 = [' class="'];
            stringList2.push(item.object);
            stringList2.push('"style="color: ');
            stringList2.push(fontColor);
            stringList2.push(' !important;"');

            let itemLink = makeItemLink(item, itemsCharacterCallback(item, false), stringList2.join(''), true);

            stringList.push('<div class="WkitTooltip ');
            stringList.push(itemClass);
            stringList.push(' ');
            stringList.push(item.object);
            stringList.push('" subjectid="');
            stringList.push(item.id.toString());
            stringList.push('">');
            stringList.push('<div class="WkitItemListed">');
            stringList.push(itemLink);
            stringList.push('</div>');
            stringList.push('<div class="WkitTooltipContent"></div>');
            stringList.push('</div>');
        };

        function makeMarkerElement(marker, meaningMode, stringList){
            stringList.push('<div class="WkitTooltip WkitTooltipIcon');
            stringList.push(meaningMode ? ' WkitMarkerMeaning' : ' WkitMarker');
            stringList.push('"><div class="');
            stringList.push(meaningMode ? 'WkitMarkerMeaning' : 'WkitMarker');
            stringList.push('" style="color: #000000 !important;"><span>');
            stringList.push(marker);
            stringList.push('</span></div></div>');
        };

        function addClassesForPosition(idx){
            let elem = $(this);
            let position = elem.position();
            elem.addClass(position.top < 180 ? "WkitFirstItem" : "WkitLaterItem");
            if (position.top > 350) elem.addClass("WkitLatestItem");
            elem.addClass(position.left < 280 ? "WkitLeftItem" : position.left < 840 ? "WkitCenterItem" : "WkitRightItem");
            elem.addClass(position.left < 560 ? "WkitLeftSide" : "WkitRightSide");
        }
    };

    // ===========================================================
    // End of functions to produce and display the content of the screen
    //------------------------------------------------------------

    // ===========================================================
    // Export functions
    //------------------------------------------------------------

    function fillClipboard(){
        document.getElementById("WkitWordExport").blur();
        quiz.exportBackup = quiz.items;
        if (quiz.settings.repeatWordCloud != 'No Repeat'){
            // make sure the repeat field endpoint is available in the items
            dataReload('wordCloud');
        } else {
            performWordCloud();
        };
    };

    function performWordCloud(){
        let items = quiz.items;
        let text = '';
        let noLatin = quiz.settings.noLatin;
        if (noLatin === undefined){noLatin = false};
        let oneItemPerLine = quiz.settings.oneItemPerLine;
        if (oneItemPerLine === undefined){oneItemPerLine = false};
        let exportLimit = quiz.settings.exportLimit;
        if (exportLimit === undefined){exportLimit = 0};
        let exportCount = 0;
        let repeatWordCloud = quiz.settings.repeatWordCloud;
        let repeatCount;

        for (var i = 0; i < items.length; i++){
            let itemsData = items[i].data;
            if (repeatWordCloud != 'No Repeat'){
                repeatCount = metadata[repeatWordCloud].wordCloud(items[i]);
            } else {
                repeatCount = 1;
            };
            for (var j = 0; j < repeatCount; j++){
                if(itemsData.characters!= null) {
                    text += itemsData.characters+' ';
                    if (oneItemPerLine){text += '\n'};
                } else if (!noLatin){
                    text += itemsData.slug+' ';
                    if (oneItemPerLine){text += '\n'};
                };
            };
            if (repeatCount != 0){exportCount += 1;};
            if (exportLimit != 0 && exportCount >= exportLimit){break};
        };

        exportDialog(text, exportCount, 'txt')
    };

    function exportTable(){
        document.getElementById("WkitExport").blur();
        let currentPreset = quiz.settings.tablePresets[quiz.settings.active_ipreset];
        let currentColumn = currentPreset[exportedInfo[0]];
        if (currentColumn === undefined || currentColumn == 'None' ){
            alert('The first column is not exported.\nPlease configure your export settings.');
            return;
        };

        // make sure all export data is available in the items
        quiz.exportBackup = quiz.items;
        dataReload('export');
    };

    function performExport(){
        let currentPreset = quiz.settings.tablePresets[quiz.settings.active_ipreset];
        let currentColumn = currentPreset[exportedInfo[0]];
        let items = quiz.items;
        let text = '';
        let exportCount = 0;
        let quotes = currentPreset.quotes;
        let separator = currentPreset.separator;
        if(separator === ',' && quotes === 'Never'){
            alert('Inconsistent settings.\nMust use quotes when separator is comma.\nChanging separator to horizontal tab.');
            separator = '\t';
        };
        let missingData = currentPreset.missingData;
        let includeLabels = currentPreset.includeLabels;
        let URLclickable = currentPreset.URLclickable;
        if (URLclickable === 'Spreadsheet' && quotes === 'Never' && (separator === ';' || separator === ',')){
            let URLcolumn = false;
            exportedInfo.forEach(item => {if (currentPreset[item] === 'Item_Page') URLcolumn = true})
            if (URLcolumn){
                alert('Inconsistent settings.\nYou have requested a clickable URL column for spreadsheet with a comma or a semicolumn separator without quotes.\nThis combination will break the csv.\nChanging separator to horizontal tab.');
                separator = '\t';
            }
        }
        if (URLclickable !== 'Plain'){
            let URLexported = false;
            let emptyColumn = '';
            let emptyColumnNumber = 0;
            for (var i = 0; i < exportedInfo.length; i++){
                if (currentPreset[exportedInfo[i]] === "Item_Page"){URLexported = true};
                if (currentPreset[exportedInfo[i]] === 'None'){
                    emptyColumnNumber = i + 1;
                    emptyColumn = exportedInfo[i];
                };
            };
            if (!URLexported){
                alert('Inconsistent settings.\nYou have requested a clickable URL but have not selected "URL of Item Page" in any column.\nAutomatically adding "URL of Item Page" to column '+i);
                currentPreset[emptyColumn] = "Item_Page";
            };
        };
        let hoursInDate = currentPreset.hoursInDate;

        // preprocessing for context sentences
        let sentencesMaxLength = 0;
        for (i = 0; i < exportedInfo.length; i++){
            let currentColumn = currentPreset[exportedInfo[i]];
            if (currentColumn !== 'Context_Sentences') continue;
            for (i = 0; i < items.length; i++){
                if (items[i].object === 'vocabulary'){
                    sentencesMaxLength = Math.max(sentencesMaxLength, (items[i].data.context_sentences.length));
                };
            };
        };

        // process title line
        let titleEntry, freeFormText;
        let firstElement = true;
        let rowList = [];
        if (currentPreset.includeTitle){
            for (i = 0; i < exportedInfo.length; i++){
                let currentColumn = currentPreset[exportedInfo[i]];
                if (currentColumn !== 'None' && currentColumn !== undefined){
                    if (currentColumn === 'Context_Sentences'){
                        makeCtxSentencesTitle();
                    } else {
                        titleEntry = metadata[currentColumn].title;
                        if (quotes === 'Always' || (quotes === 'As_Needed' && titleEntry.indexOf(' ') !== -1)){titleEntry = '"'+titleEntry+'"';}
                        if (firstElement){
                            text += titleEntry;
                            firstElement = false;
                        } else {
                            text += separator+titleEntry;
                        };
                    };
                };
            };
            //text += '\n';
            rowList.push(text);
        };

        let cellEntry, cellEntryList;
        // actually do the export
        for (i = 0; i < items.length; i++){
            firstElement = true;
            let row = [''];
            let firstColumn = true
            for (var j = 0; j < exportedInfo.length; j++){
                currentColumn = currentPreset[exportedInfo[j]];
                if (currentColumn !== 'None' && currentColumn !== undefined){
                    let metaCol = metadata[currentColumn];
                    freeFormText = metaCol.freeFormText;
                    if (!metaCol.exists(items[i])) {
                        if (currentColumn !== 'Context_Sentences'){
                            cellEntry = (missingData === 'Empty_Cell' ? '' : includeLabels ? metaCol.labelExport+'Unavailable' : 'Unavailable');
                            cellEntryList = [cellEntry];
                        } else {
                            makeEmptyCtxSentences();
                        }
                    } else {
                        cellEntry = metaCol.export(items[i]);
                        if (cellEntry === 'Unavailable'){
                            if (currentColumn === 'Context_Sentences'){
                                makeEmptyCtxSentences();
                            } else {
                                cellEntry = (missingData === 'Empty_Cell' ? '' : includeLabels ? metaCol.labelExport+'Unavailable' : 'Unavailable');
                                cellEntryList = [cellEntry];
                            };
                        } else {
                            if (metaCol.isDate && !(hoursInDate[currentColumn] === true)){
                                if (cellEntry != 'Unscheduled' && cellEntry != 'Not Yet'){cellEntry = cellEntry.slice(0, 10)};
                            };
                            if (cellEntry === ''){cellEntry = '-Empty-'};
                            if (includeLabels && currentColumn !== 'Context_Sentences') cellEntry = metaCol.labelExport+cellEntry;
                            if (currentColumn === 'Item_Page' && URLclickable !== 'Plain'){
                                let item = items[i];
                                let indentification = item.object.slice(0,3) + ' '+ (item.data.characters !== undefined ? item.data.characters : item.data.slug);
                                if (URLclickable === 'Spreadsheet'){
                                    if (quotes === 'Always' || (quotes === 'As_Needed' && (separator === ';' || separator === ','))){
                                        cellEntry = '=HYPERLINK(""'+cellEntry+'""; ""Link '+indentification+'"")';
                                    } else {
                                        cellEntry = '=HYPERLINK("'+cellEntry+'"; "Link '+indentification+'")';
                                    };
                                } else if (URLclickable === 'html') {
                                    if (quotes === 'Always'){
                                        cellEntry = "<a href='"+cellEntry+"'>"+indentification+"</a>";
                                    } else {
                                        cellEntry = '<a href="'+cellEntry+'">'+indentification+'</a>';
                                    };
                                };//contextSentences.separateJP
                            };
                            if (freeFormText){
                                cellEntry = '"'+cellEntry.replace(/["]/g, '""').replace(/<.*?>/g ,'')+'"';
                            } else {
                                if (quotes === 'Always') cellEntry = '"'+cellEntry+'"';
                                if (quotes === 'As_Needed' && metaCol.needQuotes) cellEntry = '"'+cellEntry+'"';
                                if (quotes === 'As_Needed' && URLclickable && currentColumn === 'Item_Page' && (separator === ';' || separator === ',')) cellEntry = '"'+cellEntry+'"';
                            };
                            // Empty Context Sentences generate 'Unavailable' results
                            if (currentColumn !== 'Context_Sentences'){
                                cellEntryList = [cellEntry];
                            } else {
                                fillInCtxSentences();
                            };
                        };
                    };
                    let row2 = [];
                    let cell2;
                    for (let cell of row){
                        for (let entry of cellEntryList){
                            if (firstColumn){
                                cell2 = entry;
                                firstColumn = false;
                            } else {
                                cell2 = cell + separator + entry;
                            };
                            row2.push(cell2);
                        };
                    };
                    row = row2;
                };
            };
            rowList.push(row.join('\n'));
            firstElement = false;
            exportCount += 1;
        };
        text = rowList.join('\n');

        exportDialog(text, exportCount, 'csv');

        function makeEmptyCtxSentences(){
            switch(currentPreset.contextSentences){
                case 'separateJP':
                case 'separateEN':
                    if (missingData === 'Empty_Cell'){
                        cellEntry = separator;
                        cellEntryList = [cellEntry];
                    } else {
                        cellEntry = 'Unavailable'+separator+'Unavailable';
                        cellEntryList = [cellEntry];
                    };
                    break;
                case 'sameJP':
                case 'sameEN':
                    if (missingData === 'Empty_Cell'){
                        cellEntry = separator;
                        for (let i = 2; i <= sentencesMaxLength ; i++) cellEntry += separator + separator;
                        cellEntryList = [cellEntry];
                    } else {
                        cellEntry = 'Unavailable'+separator+'Unavailable';
                        for (let i = 2; i <= sentencesMaxLength ; i++) cellEntry += separator + 'Unavailable' + separator + 'Unavailable';
                        cellEntryList = [cellEntry];
                    };
                    break;
            };
        };

        function fillInCtxSentences(){
            // context sentences have " quotes and linefeeds - escaping " and surronding quotes are mandatory
            let text2;
            switch(currentPreset.contextSentences){
                case 'separateJP':
                    if (cellEntry.length === 0) {
                        cellEntryList = ['Unavailable'+separator+'Unavailable'];
                    } else {
                        text2 = '"'+cellEntry[0].ja.replace(/["]/g, '""')+'"';
                        text2 += separator+'"'+cellEntry[0].en.replace(/["]/g, '""')+'"';
                        cellEntryList = [text2];
                    };
                    for (let i = 1; i < cellEntry.length; i++){
                        text2 = '"'+cellEntry[i].ja.replace(/["]/g, '""')+'"';
                        text2 += separator+'"'+cellEntry[i].en.replace(/["]/g, '""')+'"';
                        cellEntryList.push(text2);
                    };
                    break;
                case 'separateEN':
                    if (cellEntry.length === 0) {
                        cellEntryList = ['Unavailable'+separator+'Unavailable'];
                    } else {
                        text2 = '"'+cellEntry[0].en.replace(/["]/g, '""')+'"';
                        text2 += separator+'"'+cellEntry[0].ja.replace(/["]/g, '""')+'"';
                        cellEntryList = [text2];
                    };
                    for (let i = 1; i < cellEntry.length; i++){
                        text2 = '"'+cellEntry[i].en.replace(/["]/g, '""')+'"';
                        text2 += separator+'"'+cellEntry[i].ja.replace(/["]/g, '""')+'"';
                        cellEntryList.push(text2);
                    };
                    break;
                case 'sameJP':
                    if (cellEntry.length === 0) {
                        text2 = 'Unavailable'+separator+'Unavailable';
                    } else {
                        text2 = '"'+cellEntry[0].ja.replace(/["]/g, '""')+'"';
                        text2 += separator+'"'+cellEntry[0].en.replace(/["]/g, '""')+'"';
                     };
                    for (let i = 1; i < sentencesMaxLength; i++){
                        if (i < cellEntry.length){
                            text2 += separator+'"'+cellEntry[i].ja.replace(/["]/g, '""')+'"';
                            text2 += separator+'"'+cellEntry[i].en.replace(/["]/g, '""')+'"';
                        } else {
                            text2 += separator + 'Unavailable' + separator + 'Unavailable';
                        };
                    };
                    cellEntryList = [text2];
                    break;
                case 'sameEN':
                    if (cellEntry.length === 0) {
                        text2 = 'Unavailable'+separator+'Unavailable';
                    } else {
                        text2 = '"'+cellEntry[0].en.replace(/["]/g, '""')+'"';
                        text2 += separator+'"'+cellEntry[0].ja.replace(/["]/g, '""')+'"';
                     };
                   for (let i = 1; i < sentencesMaxLength; i++){
                        if (i < cellEntry.length){
                            text2 += separator+'"'+cellEntry[i].en.replace(/["]/g, '""')+'"';
                            text2 += separator+'"'+cellEntry[i].ja.replace(/["]/g, '""')+'"';
                        } else {
                            text2 += separator + 'Unavailable' + separator + 'Unavailable';
                        };
                   };
                   cellEntryList = [text2];
                   break;
            };
        };

        function makeCtxSentencesTitle(){
            switch (currentPreset.contextSentences){
                case 'separateJP':
                    if (firstElement){
                        text += 'Context Sentence JP';
                        text += separator+'Context Sentence EN';
                        firstElement = false;
                    } else {
                        text += separator+'Context Sentence JP';
                        text += separator+'Context Sentence EN';
                    };
                    break;
                case 'separateEN':
                    if (firstElement){
                        text += 'Context Sentence EN';
                        text += separator+'Context Sentence JP';
                        firstElement = false;
                    } else {
                        text += separator+'Context Sentence EN';
                        text += separator+'Context Sentence JP';
                    };
                    break;
                case 'sameJP':
                    if (firstElement){
                        text += 'Context Sentence JP 1';
                        text += separator+'Context Sentence EN 1';
                        firstElement = false;
                    } else {
                        text += separator+'Context Sentence JP 1';
                        text += separator+'Context Sentence EN 1';
                    };
                    for (let i = 2; i <= sentencesMaxLength; i++){
                        text += separator+'Context Sentence JP ' + i;
                        text += separator+'Context Sentence EN ' + i;
                    };
                    break;
                case 'sameEN':
                    if (firstElement){
                        text += 'Context Sentence EN 1';
                        text += separator+'Context Sentence JP 1';
                        firstElement = false;
                    } else {
                        text += separator+'Context Sentence EN 1';
                        text += separator+'Context Sentence JP 1';
                    };
                    for (let i = 2; i <= sentencesMaxLength; i++){
                        text += separator+'Context Sentence EN ' + i;
                        text += separator+'Context Sentence JP ' + i;
                    };
                    break;
            };
        };
    };

    var text;
    var exportCount;
    function exportDialog(xtext,xexportCount,ext){
        text = xtext;
        exportCount = xexportCount;

        let encoded = encodeURIComponent("\uFEFF"+text);
        let link = '<a href="data:text/csv; charset=utf-8,'+encoded+'" download="Item Inspector Export.'+ext+'">Download</a>';
        let dialog = '<button id="WkitClipboardButton" class="WkitExportButton">Copy to Clipboard</button>' +
            '<button id="WkitDownLoadButton" class="WkitExportButton">'+link+'</button>' +
            '<button id="WkitCancelButton" class="WkitExportButton">Cancel</button>';

        $("#WkitDialogContainer").html(dialog);
        $("#WkitClipboardButton").click(clipboardHandler);
        $("#WkitDownLoadButton").click(downloadlHandler);
        $("#WkitCancelButton").click(cancelHandler);
        $("#WkitDialogContainer").css('display', 'block');

        function clipboardHandler(e){
            $("#WkitDialogContainer").html('');
            $("#WkitDialogContainer").css('display', 'none');
            quiz.items = quiz.exportBackup;
            delete quiz.exportBackup;
            navigator.clipboard.writeText(text)
                .then(function(){alert(exportCount+' items have been exported to the clipboard.');dataReload('table');})
        }

        function downloadlHandler(e){
            $("#WkitDialogContainer").html('');
            $("#WkitDialogContainer").css('display', 'none');
            quiz.items = quiz.exportBackup;
            delete quiz.exportBackup;
            alert(exportCount+' items are being downloaded.')
            dataReload('table');
        }

        function cancelHandler(e){
            $("#WkitDialogContainer").html('');
            $("#WkitDialogContainer").css('display', 'none');
            quiz.items = quiz.exportBackup;
            delete quiz.exportBackup;
            dataReload('table');
        }
    }


    // ===========================================================
    // End of Export functions
    //------------------------------------------------------------

    // ===========================================================
    // Built-in filters
    //------------------------------------------------------------

    // BEGIN Search

    function registerSearchFilters(){
        waitForItemDataRegistry()
            .then(registerSearchFilter)
            .then(function(){return Promise.resolve()})
    }

	function registerSearchFilter() {
        var filterNamePrefixSearch = 'searchFilters_';
        var globalSearchFilterName = filterNamePrefixSearch + 'globalSearch';
        let searchHover_tip = 'Enter a search term for meaning, reading or kanji.\nAll approximate matches will be found.\nYou may use latin, kana and kanji.\nMultiple terms separated by commas are allowed.';

		wkof.ItemData.registry.sources.wk_items.filters[globalSearchFilterName] = {
			type: 'text',
			label: 'Global Search',
            placeholder: 'gambler, 力士',
			default: '',
			filter_func: searchFilter,
            filter_value_map: split_list,
			set_options: function(options) { options.subjects = true; },
			hover_tip: searchHover_tip,
		};

        function split_list(str) {return str.replace(/、/g,',').replace(/[\s ]+/g,' ').trim().replace(/ *, */g, ',').toLowerCase().split(',').filter(function(name) {return (name.length > 0);});}
	}

	function searchFilter(filterValue, item) {
		if (item.data === undefined) {
			return false;
		};
        for (var searchTerm of filterValue){
            if (item.data.characters !== null) if (item.data.characters.indexOf(searchTerm) >= 0){return true};
            if (item.data.slug.indexOf(searchTerm.replace(' ', '-')) >= 0){return true};
            for (var meaning of item.data.meanings){
                if (meaning.accepted_answer && meaning.meaning.toLowerCase().indexOf(searchTerm) >= 0){return true};
            };
            if (item.object === 'kanji' || item.object === 'vocabulary'){
                for (var reading of item.data.readings){
                    if (reading.accepted_answer && reading.reading.indexOf(searchTerm) >= 0){return true};
                };
            };
        };
		return false;

	}

    // END Search

    // BEGIN JLPT

    function registerJLPTFilters(){
        waitForItemDataRegistry()
            .then(registerJLPTFilter)
            .then(function(){return Promise.resolve()})
    }

	function registerJLPTFilter() {
        var JLPTFilterName = 'jlpt_level_vocab';
        let JLPTHover_tip = 'Filter kanji by JLPT level.\nSelects the kanji.\nIncludes vocabulary where the\nhighest level kanji is of selected level.';

		wkof.ItemData.registry.sources.wk_items.filters[JLPTFilterName] = {
            type: 'multi',
            label: 'JLPT level with vocab',
            default: {5: false, 4: false, 3: false, 2: false, 1: false, 0: false},
            content: {5: 'N5', 4: 'N4', 3: 'N3', 2: 'N2', 1: 'N1', 0: 'Not Classified in JLPT'},
            hover_tip: 'Filter kanji by JLPT level.\nSelects the kanji.\nIncludes vocabulary where the\nhighest level kanji is of selected level.',
            filter_func: function (filterValue, item) {return (item.object !== 'radical') ? accept_jlpt_kanji_vocab(filterValue, item) : false},
			hover_tip: JLPTHover_tip,
		};
    };

    function accept_jlpt_kanji(filter_value, characters) {
        var jlpt_level_data = jlptJoyoFreqdata[characters];
        var jlpt_level;
        if (!jlpt_level_data) {
            jlpt_level = 0;
        } else {
            jlpt_level = jlpt_level_data.jlpt_level || 0;
        }
        return (filter_value[jlpt_level] === true);
    }

    function accept_jlpt_kanji_vocab(filter_value, item) {
        var characters = item.data.characters;
        if (item.object === 'kanji') return accept_jlpt_kanji(filter_value, characters);
        var minLevel = 6;
        for (var idx in characters) {
            var char = characters.charAt(idx);
            if (isKanji(char)){
                var jlpt_data = jlptJoyoFreqdata[char];
                if (!jlpt_data) {
                    minLevel = 0;
                } else {
                    minLevel = Math.min(minLevel, jlpt_data.jlpt_level || 0);
                };
            };
        };
        return (filter_value[minLevel] === true);
    }

    // END JLPT

    // BEGIN Date

    function registerDateFilters(){
        waitForItemDataRegistry()
            .then(registerHadPassedGuruFilter)
            .then(function(){return Promise.resolve()})
    }

	function registerHadPassedGuruFilter() {
        var filterNamePrefixDate = 'dateFilters_';
        var hadPassedGuruFilterName = filterNamePrefixDate + 'hadPassedGuru';
        let hadPassedGuruFilterHover_tip = 'If checked selects items that have passed guru.\nIf unchecked selects the items that have never passed guru.';

		wkof.ItemData.registry.sources.wk_items.filters[hadPassedGuruFilterName] = {
			type: 'checkbox',
			label: 'Had Passed Guru',
			default: true,
			filter_func: hadPassedGuruFilter,
			set_options: function(options) { options.assignments = true; },
			hover_tip: hadPassedGuruFilterHover_tip,
		};
	}

	function hadPassedGuruFilter(filterValue, item) {
		if (item.assignments === undefined) {
			return !filterValue;
		}
		return filterValue ? (item.assignments.passed_at !== null) : (item.assignments.passed_at === null);
	}

    // END Date

	// BEGIN Statistics
    function registerStatisticsFilters(){
        waitForItemDataRegistry()
            .then(registerMinCurStrGteqFilter)
            .then(registerMinCurStrLteqFilter)
            .then(function(){return Promise.resolve()})
    }

    //======================================================
    // Streak Filters
    //
    // Wanikani starts the streak count at 1, that is when the last review is failed, the streak is 1, not 0.
    // User facing data is adjusted in Item Inspector to start the streak count at 0 because starting at 1 is not intuitive.
    // The filters do so too because the filter value in the settings panel is also user facing data that may be correlated with Item Inspector data.
    // This is done by adjusting the filter value through passing streakValueAdjustment to the filter_value_map: registering option.
    // This adjustment is not made in leech calculations because a- this use of streaks is not user facing data - and b- there is an history of
    // calculating leech values this way and it would be disruptive to change it.

    function streakValueAdjustment(param){return param + 1};

	function registerMinCurStrGteqFilter() {
        var filterNamePrefix = 'statsFilters_';
        var minCurStrGteqFilterName = filterNamePrefix + 'minCurStrGteq';
        let minCurStrGteqFilterHover_tip = 'Selects items where the minimum of current Meaning streak\nand current Reading streak is &gt;= this value.';

        wkof.ItemData.registry.sources.wk_items.filters[minCurStrGteqFilterName] = {
			type: 'number',
			label: 'Minimum Cur. Str. &gt;=',
			default: 0,
            filter_value_map: streakValueAdjustment,
            filter_func: minCurStrGteqFilter,
			set_options: function(options) { options.review_statistics = true; },
			hover_tip: minCurStrGteqFilterHover_tip,
		};
	}

	function minCurStrGteqFilter(filterValue, item) {
        let review_statistics = item.review_statistics;
		if (review_statistics === undefined) {
			return false;
		}
        if (item.object === 'radical'){
	    	return review_statistics.meaning_current_streak >= filterValue;
        } else {
		    return review_statistics.meaning_current_streak >= filterValue && review_statistics.reading_current_streak >= filterValue;
        };
	}

	function registerMinCurStrLteqFilter() {
        var filterNamePrefix = 'statsFilters_';
        var minCurStrLteqFilterName = filterNamePrefix + 'minCurStrLteq';
        let minCurStrLteqFilterHover_tip = 'Selects items where the minimum of current Meaning streak\nand current Reading streak is &lt;= this value.';

		wkof.ItemData.registry.sources.wk_items.filters[minCurStrLteqFilterName] = {
			type: 'number',
			label: 'Minimum Cur. Str. &lt;=',
			default: 100,
            filter_value_map: streakValueAdjustment,
			filter_func: minCurStrLteqFilter,
			set_options: function(options) { options.review_statistics = true; },
			hover_tip: minCurStrLteqFilterHover_tip,
		};
	}

	function minCurStrLteqFilter(filterValue, item) {
        let review_statistics = item.review_statistics;
		if (review_statistics === undefined) {
			return false;
		}
        if (item.object === 'radical'){
	    	return review_statistics.meaning_current_streak <= filterValue;
        } else {
	    	return review_statistics.meaning_current_streak <= filterValue || review_statistics.reading_current_streak <= filterValue;
        }
	}

	// END Statistics

    // ===========================================================
    // End of Built-in filters
    //------------------------------------------------------------

    // ===========================================================
    // Integration of Self-Study Quiz
    //------------------------------------------------------------

	// BEGIN Item Inspector wkof Filter

    // This filter is not with the built-in filters because it is used solely to
    // integrate Self-Study Quiz

    function waitForItemDataRegistry() {
        return wkof.wait_state('wkof.ItemData.registry', 'ready');
	}

	function registerItemInspectorFilter() {
        waitForItemDataRegistry()
           .then(function(){
                delete wkof.ItemData.registry.sources.wk_items.filters.itemInspectorFilter;
                wkof.ItemData.registry.sources.wk_items.filters.itemInspectorFilter = {
                    type: 'text',
                    label: 'Item Inspector',
                    default: '',
                    placeholder: 'The input is not used',
                    filter_func: itemInspectorFilter,
                    set_options: function(options) { return },
                    hover_tip: 'Tool for Item Inspector Integration\nShould Be Turned OFF\nMay Cause Problems If Turned On',
                    no_ui: true,
                };
                return Promise.resolve();
             })
	}

    var quizzedItems = {};
	function itemInspectorFilter(filterValue, item) {
		return (quizzedItems[item.id] === true);
	}
	// END Item Inspector wkof Filter

    var dataReady = false;
    function quizOnWholeTable(e){
        document.getElementById("WkitQuizTable").blur();
        if (dataReady) launchSelfStudyQuiz(0, quiz.items.length);
    };

    function quizOnSelection(e){
        document.getElementById("WkitQuizSelection").blur();
        if (dataReady) launchSelfStudyQuiz(currentItem, nextCurrentItem);
    }

    function launchSelfStudyQuiz(start, end){
        quizzedItems = {};
        let items = quiz.items;
        let i = start;
        while (i < end){
            quizzedItems[items[i].id] = true;
            i++
        }
        let config = {ipreset: {name: 'Item_Inspector', on_close: quizClose, content: {
                                wk_items: {enabled: true, filters: {itemInspectorFilter: {enabled: true, value: ''},}},
                           }},
                  };
        wkof.wait_state('ss_quiz', 'ready').then(function(){ss_quiz.open(config)});
    };

    function quizClose(){
        return;
    }

    // ===========================================================
    // End of Integration of Self-Study Quiz
    //------------------------------------------------------------

    // ===========================================================
    // initialization and startup
    //------------------------------------------------------------

    function insertContainer(){
        /* build containers for the table elements */
        const helpURL = 'https://community.wanikani.com/t/userscript-wanikani-item-inspector/44564';
        let sectionContainer = '<div id="WkitTopBar" class="WkitTopBar"></div> ';
        let topBlock = '<div id="WkitControlBar" class="WkitControlBar">' +
            '<div class="WkitHeader">' +
            '<div class="WkitControlLeft">'+
            '<button id="WkitFirstButton" type="button" class="WkitButton WkitButtonleft icon-fast-backward"></button>' +
            '<button id="WkitBackwardButton" type="button" class="WkitButton WkitButtonleft" style="padding-right: 8px; padding-bottom: 3px;">&#9668</button>' +
            '<button id="WkitForwardButton" type="button" class="WkitButton WkitButtonleft" style="padding-left: 7px; padding-bottom: 3px;">&#9658</button>' +
            '<button id="WkitLastButton" type="button" class="WkitButton WkitButtonleft icon-fast-forward"></button>' +
            '<select id="WkitTableSelector" class="WkitSelector" title="Choose the table you want to display"></select>'+
            '<button id="WkitToogleDisplay" type="button" class="WkitButton WkitButtonleft icon-bullseye" title="Toggles between Tables and Lists of icons"icon-bullseye></button>' +
            '<button id="WkitToogleLanguage" type="button" class="WkitButton WkitButtonleft" title="Toggles the current page between English and Japanese\nPages other than the current one are unaffected." style="font-size:18px; font-weight: 500;"　lang="JP"></button>' +
            '<button id="WkitToogleAudio" type="button" class="WkitButton WkitButtonleft" title="Turns on/off clicking on vocabulary items to play audio.\nAudio is automalically turned off when you click on a button that may change the screen." style="font-size:15px; font-weight: bold; padding-bottom: 1px"></button>' +
            '<div class="WkitSpacer"><span>x</span></div>'+
            '<button id="WkitRandomSelection" type="button" class="WkitButton WkitButtonleft icon-retweet" title="Fill the screen with randomly chosen items.\nPermits to be quized on randomly picked items.\nClick again to return to whole table."></button>' +
            '<button id="WkitDateOrdering" type="button" class="WkitButton WkitButtonleft icon-sort-by-attributes" title="Toggles the ordering of items by date and time.\nEnables navigation over time ranges.\nPermits to be quized on items selected by date.\nClick again to return to whole table,"></button>' +
            '<div class="WkitSpacer"><span>x</span></div>'+
            '<select id="WkitFilterSelector" class="WkitSelector" title="Choose the temporary filter you want to apply"></select>'+
            '</div>' +
            '<p class="WkitTitle"><b>Wanikani Item Inspector</b></p>' +
            '<div class="WkitControlRight">'+
            '<button id="WkitDocumentation"type="button" class="WkitButton WkitButtonRight" title="Go to Item Inspector Page" style="font-size:22px; font-weight: bold; padding: 4px"><a href="'+helpURL+'" target="_blank">?</a></button>' +
            '<button id="WkitSettings" type="button" class="WkitButton WkitButtonRight icon-gear" title="Settings" style="font-size:20px;"></button>' +
            '<button id="WkitWordExport" type="button" class="WkitButton WkitButtonRight icon-cloud" title="Export items\nSuitable for word clouds."></button>' +
            '<button id="WkitExport" type="button" class="WkitButton WkitButtonRight" title="Export to format csv.\nSuitable for spreasheet, Anki and Kitsun." style="font-size:20px;">&#8686;</button>' +
            '<button id="WkitQuizSelection" type="button" class="WkitButton WkitButtonRight icon-desktop" title="Quiz on items shown on the screen.\nUse navigation and random selection options\n to control which items are displayed."></button>' +
            '<button id="WkitQuizTable" type="button" class="WkitButton WkitButtonRight icon-table" title="Quizzes on the whole table.\nWhen a random selection is activee quizzes on the selection."></button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div id="WkitDialogContainer" class="WkitDialogContainer">Text here for testing</div>' +
            '<div id="leech_table">'+waitMessage+'</div>';

        if (quiz.settings.position === undefined) {quiz.settings.position = 2};
        let position = [".progress-and-forecast", '.progress-and-forecast', '.srs-progress',  '.span12 .row', '.span12 .row:last-of-type',][quiz.settings.position];
        if (quiz.settings.position == 0){
            $(position).before(sectionContainer);
        } else {
            $(position).after(sectionContainer);
        }
        // insert the top block - must be separate from the sectionContainer to work around a bug
        $('#WkitTopBar').append(topBlock);  // must be appended - someone else may be there due to the bug
        formatControlBar();
        populateDropdown();
        setButtonsVisibility();
    };

    function setButtonsVisibility(){
        var settings = quiz.settings;
        var widgetsData = {englishMode: '#WkitToogleLanguage', audioMode: '#WkitToogleAudio', randomSelection: '#WkitRandomSelection', dateOrdering: '#WkitDateOrdering',
                           exportCSV: '#WkitExport', itemExport: '#WkitWordExport', selfStudy: '#WkitQuizSelection', temporaryFilters: '#WkitFilterSelector',};
        for (var feature in widgetsData){
            if (settings.enableFeatures[feature] === true){
                $(widgetsData[feature]).css('display', 'inline');
            } else {
                $(widgetsData[feature]).css('display', 'none');
            };
        }
        if (settings.enableFeatures.selfStudy === true){
            $('#WkitQuizTable').css('display', 'inline');
        } else {
            $('#WkitQuizTable').css('display', 'none');
        };
        if (settings.enableFeatures.temporaryFilters === false){
            $('.WkitTitle').css('display', 'inline');
        } else {
            $('.WkitTitle').css('display', 'none');
        };
    }

    function populateDropdown(){
        // Populate the dropdown with the configured tables
        let activeTable = quiz.settings.active_ipreset;
        var tableList = '';
        var ipresets = quiz.settings.ipresets;
        for (var table of ipresets) {
            tableList += '<option>' + table.name.replace(/</g,'&lt;').replace(/>/g,'&gt;') +'</option>'
        };
        var dropdown = $('#WkitTableSelector');
        dropdown.html(tableList);
        $('#WkitTableSelector').prop('selectedIndex',activeTable);

        // Populate the other dropdown with the temporary filters
        tableList = '';
        let activeFilter = quiz.settings.active_fpreset;
        var fpresets = quiz.settings.fpresets;
        for (table of fpresets) {
            tableList += '<option>' + table.name.replace(/</g,'&lt;').replace(/>/g,'&gt;') +'</option>'
        };
        dropdown = $('#WkitFilterSelector');
        dropdown.html(tableList);
        $('#WkitFilterSelector').prop('selectedIndex',activeFilter);
    };

    function formatControlBar (){
        if (quiz.settings.tablePresets[quiz.settings.active_ipreset].displayMeaning){$('#WkitToogleLanguage').html('字')} else {$('#WkitToogleLanguage').html('<span class="WkitEnglishButton">E</span>')};
        if (quiz.settings.audioMode){$('#WkitToogleAudio').html('<span style="padding-left: 2px;">&#9654;</span>')} else {$('#WkitToogleAudio').html('<span style="text-decoration: underline; font-size: 18px; padding-bottom: 8px; padding-left: 0px;">L</span>')};
    };

    function eventHandlers() {
        /* Define the button actions. Must be done when the DOC is completed */
        $("#WkitFirstButton").click(clickedFirst);
        $("#WkitBackwardButton").click(clickedBackward);
        $("#WkitForwardButton").click(clickedForward);
        $("#WkitLastButton").click(clickedLast);
        $('#WkitTableSelector').change(selectTable);
        $('#WkitToogleDisplay').click(toggleDisplay);
        $('#WkitToogleLanguage').click(toggleLanguage);
        $('#WkitToogleAudio').click(toggleAudio);
        $('#WkitRandomSelection').click(toggleRandomSelection);
        $('#WkitDateOrdering').click(toggleDateOrdering);
        $('#WkitQuizTable').click(quizOnWholeTable);
        $('#WkitQuizSelection').click(quizOnSelection);
        $("#WkitWordExport").click(fillClipboard);
        $("#WkitExport").click(exportTable);
        $("#WkitSettings").click(open_quiz_settings);

        // handy little trick to permit to select twice the same option on a dropdown
        var $select = $('#WkitFilterSelector'); // configured for the temporary filter selector

        $select.click(function(){
            var $this = $(this);
            if ($this.hasClass('open')) {
                selectTemporaryFilter();
                $this.removeClass('open');
            }else {
                $this.addClass('open');
            };
        })

        $select.blur(function(){
            $(this).removeClass('open');
        });

        $(document).click(function(e){
            if (!$select.is(e.target)){
                $select.removeClass('open');
            }
        });
        // end of clicking twice the same dropdown
    };

    // -------------------------------------------------------------------------------------
    // Functions for loading scripts and data files, managing the cache while we are at it
    // -------------------------------------------------------------------------------------

    function loadPrerequisiteScripts(){
        let promiseList = [];
        promiseList.push(wkof.load_script(lodash_file, true).then(function(){return wkof.wait_state('Wkit_lodash','Ready')}));
        promiseList.push(wkof.load_script(lzma_file, true).then(function(){return wkof.wait_state('Wkit_lzma','Ready')}));
        promiseList.push(wkof.load_script(lzma_shim_file, true).then(function(){return wkof.wait_state('Wkit_lzma_shim','Ready')}));
        return Promise.all(promiseList);
    };

    function loadItemsFiltersAndDb(){
         var supportWait_state = {dateFilters: 'dateFilters', statsFilters: 'statsFilters', searchFilters: 'searchFilters', itemList: 'item_list_filter', partOfSpeech: 'pos_filter',
                                 joyoJpltFrequency: 'JJFFilters', visSim: 'VSKFilter'};

         return loadAllItemsFiltersAndDb()

        // settings defaults are not initialized when loadFilters is called - We need to manually check for undefined
        function loadAllItemsFiltersAndDb(){
            let promiseList = [];
            let settings = wkof.settings[scriptId];

            promiseList.push(fetch_all_items().then(loadSvgForRadicals));
            promiseList.push(initLastSelectionRecorded());

            for (let filter in optionalFilters){
                if (settings.optionalFilters !== undefined && settings.optionalFilters[filter]){
                    promiseList.push(wkof.load_script(optionalFilters[filter], true));
                    let wait = supportWait_state[filter];
                    if (typeof wait === 'string') promiseList.push(wkof.wait_state(wait, 'ready'));
                };
            };

            // load included filters if not included with user selected filter scripts
            if (settings.optionalFilters === undefined || !settings.optionalFilters.dateFilters) promiseList.push(registerDateFilters());
            if (settings.optionalFilters === undefined || !settings.optionalFilters.statsFilters) promiseList.push(registerStatisticsFilters());
            if (settings.optionalFilters === undefined || !settings.optionalFilters.searchFilters) promiseList.push(registerSearchFilters());
            if (settings.optionalFilters === undefined || !settings.optionalFilters.joyoJpltFrequency) promiseList.push(registerJLPTFilters());
            promiseList.push(registerItemInspectorFilter());

            // load externally supplied databases
            promiseList.push(loadKeiseiDatabase());
            promiseList.push(get_visually_similar_data());
            promiseList.push(get_stroke_order_file());

            return Promise.all(promiseList);
        }

    };

    function ageCache(){
        // periodically ageing the cache
        let promiseList = [];
        let ageingTime = 1000*60*60*24*30*2;  // two months
        let now = Date.now();
        // settings defaults are not initialized when ageCache is called - We need to test for undifined when running for the first time
        if (wkof.settings[scriptId] === undefined) wkof.settings[scriptId] = {};
        if (wkof.settings[scriptId].lastTime === undefined){
            wkof.settings[scriptId].lastTime = now;
            promiseList.push(wkof.Settings.save(scriptId));
        }
        if (now > wkof.settings[scriptId].lastTime + ageingTime){
            deleteFilesFromCache();
            wkof.settings[scriptId].lastTime = now;
            promiseList.push(wkof.Settings.save(scriptId));
        }
        return Promise.all(promiseList);
    };

    function deleteFilesFromCache(){
        for (let filter in optionalFilters) wkof.file_cache.delete(optionalFilters[filter]);
        deleteKeiseiCache();
        deleteVisuallySimilarCache();
        deleteStokeOrderCache();
        wkof.file_cache.delete(Wkit_SVGforRadicals);
        wkof.file_cache.delete(lodash_file);
        wkof.file_cache.delete(lzma_file);
        wkof.file_cache.delete(lzma_shim_file);
    };

    //------------------------------------------
    // Prerequisite validations
    //------------------------------------------
    //
    // Call this function and pass in the name of the font you want to check for availability.
    // Permission to use this code granted by the author at the link below.
    // https://www.kirupa.com/html5/detect_whether_font_is_installed.htm
    //
    function doesFontExist(fontName) {
        // creating our in-memory Canvas element where the magic happens
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");

        // the text whose final pixel size I want to measure
        var text = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";

        // specifying the baseline font
        context.font = "72px monospace";

        // checking the size of the baseline text
        var baselineSize = context.measureText(text).width;

        // specifying the font whose existence we want to check
        context.font = "72px '" + fontName + "', monospace";

        // checking the size of the font we want to check
        var newSize = context.measureText(text).width;

        // removing the Canvas element we created
        canvas = null;

        //
        // If the size of the two text instances is the same, the font does not exist because it is being rendered
        // using the default sans-serif font
        //
        if (newSize === baselineSize) {
            return false;
        } else {
            return true;
        }
    }

    var notSelfStudyQuiz = false;
    function check_Self_Study_Quiz(){
        let settings = wkof.settings[scriptId];
        if (settings.enableFeatures !== undefined && settings.enableFeatures.selfStudy === false) {
            notSelfStudyQuiz = true;
            return;
        }
        if ($('#selfstudyquiz_script_link a').length === 0) {
            script_name = 'Wanikani Item Inspector';
            response = confirm(script_name + ' requires  Self Study Quiz.\nWithout this script the two quiz buttons will not work.\n\n Click "OK" to be forwarded to installation instructions.');
            if (response) {
                window.location.href = 'https://community.wanikani.com/t/userscript-self-study-quiz/13191';
            };
        } else {
            notSelfStudyQuiz = true;
        }
    };

    var hasAdditionalFilters = false;
    function check_additional_filters(){
        //    notAdditionalFilters = true;
        if (!window.wkof.ItemData.registry.sources.wk_items.filters.additionalFilters_leechTraining) {
            script_name = 'Wanikani Item Inspector';
            response = confirm(script_name + ' requires  WaniKani Open Framework Additional Filters.\nIf you have already installed it please enable the filters in the settings.\n Click "OK" to be forwarded to installation instructions.');
            if (response) {
                window.location.href = 'https://community.wanikani.com/t/userscript-wanikani-open-framework-additional-filters-recent-lessons-leech-training-related-items-and-more/30512';
            };
        } else {
            hasAdditionalFilters = true;
        };
    };

    var accessAllowed = true;
    function testPrerequisites(){
        script_name = 'Wanikani Item Inspector';

        if (userData.subscription.max_level_granted !== 60) {
            accessAllowed = false;
            alert(script_name + ' requires an active subscription to access the data.');
            return;
        };


        check_additional_filters();
        check_Self_Study_Quiz();

        if ((!doesFontExist('KanjiStrokeOrders')) && quiz.settings.tablePresets.reduce(((acc, val)=>(val.showStrokeOrder || acc)), false)) {
            response = confirm(script_name + ' requires  Kanji Stroke Order Font.\nWithout this font the Kanji Stroke Order popups\nwill not show the stroke order.\n\n Click "OK" to be forwarded to installation instructions.');
            if (response) {
                window.location.href = 'https://www.nihilist.org.uk/';
            };
        };

        const currentQuestionNumber = 2;
        const asked = wkof.settings[scriptId].questionAsked || 0;
        if (asked < currentQuestionNumber && lackDefaults()) {
            response = confirm(script_name + ' determined you are missing defaults tables and/or temporary filters.\n\n Click "OK" to have these missing features added to your configuration.');
            if (response) {
                restoreMissingDefaults();
            };
            wkof.settings[scriptId].questionAsked = currentQuestionNumber;
            wkof.wait_state(Wkit_navigation, 'Ready') // waiting for caching activity to end
                .then(function(){wkof.set_state(Wkit_navigation, 'Pending')})
                .then(function(){return wkof.Settings.save(scriptId)})
                .then(function(){wkof.set_state(Wkit_navigation, 'Ready')})
       };
    };

    //------------------------------------------
    // Starting the program
    // at the end to ensure the global variables are initialized
    //------------------------------------------

    function initSequence(){
        // we need settings activity in cache management to stop before navigation occurs
        ageCache().then(function(){return wkof.set_state(Wkit_navigation, 'Ready')});
        init_settings();
        testPrerequisites();
        if (hasAdditionalFilters && accessAllowed){
            setup_quiz_settings();
            install_css();
            table_css();
            install_menu();
            initCurrentItem();
            setNumberOfLines();
            insertContainer();
            eventHandlers();
            dataReload('table');
            dataReady = true;
        };
    };

    var userData; // Then contents of the user endpoint

    wkof.include('ItemData, Menu, Settings');

    // parallelism to reduce startup latency, especially if network transfer are involved
    Promise.all([loadPrerequisiteScripts(),
                 wkof.ready('Settings').then(function(){return wkof.Settings.load(scriptId)}),
                 wkof.ready('Apiv2')
                       .then(function(){return wkof.Apiv2.get_endpoint('user')})
                       .then(function(data){userData = data}),
                 wkof.ready('ItemData, Menu'),
                ])
        .then(loadItemsFiltersAndDb) // needs prerequisite scripts, ItemData and loaded settings
        .then(initSequence)

    // Handy little function that rfindley wrote. Checks whether the theme is dark.
    function is_dark_theme() {
        // Grab the <html> background color, average the RGB.  If less than 50% bright, it's dark theme.
        return $('body').css('background-color').match(/\((.*)\)/)[1].split(',').slice(0,3).map(str => Number(str)).reduce((a, i) => a+i)/(255*3) < 0.5;
    }


})();
