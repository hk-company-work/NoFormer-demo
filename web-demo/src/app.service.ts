import { Injectable, Response } from '@nestjs/common';

@Injectable()
export class AppService {
  homepageHtml(hint: string = ""): string {
    let res = "";
    res += "<html>"
    if (hint != "") {
      //res += `<head><meta http-equiv="refresh" content="2"></head>`;
      /*res += `<head><script>
        setTimeout(function(){
          window.location.replace("http://127.0.0.1:3000/");
        }, 500);
      </script></head>`;*/
    }
    res += "<body>"
    res += "<h2>No Former's medical blockchain demo</h2>";
    if (hint != "") {
      res += "<h3>(" + new Date(Date.now()).toLocaleTimeString() + ") Message: " + hint + "</h3>"
    }
    res += jsonSectionHtml(s_chain);
    res += "<br><br>";
    res += addBlkHtml();
    res += "<br><br>";
    for (let blk of s_chain.blocks) {
      res += blkTableHtml(blk);
    }
    res += "<br><br>";
    res += "</body></html>";
    return res;
  }

  loadJson(jsonFile: string): string {
    return s_chain.parseJson(jsonFile) ? "" : "blockchain.json provided is invalid";
  }

  mineBlock(hkid: string, patient: string, doctor: string, date: string, userdata: string): string {
    let message = 
    (`HKID   : ${hkid}
    Patient : ${patient}
    Doctor  : ${doctor}
    Date    : ${date}`);

    s_chain.mineAndPush(message, userdata);
    return "";
  }
}


import fs from "fs";
import * as crypto from "crypto";

class Block {
	index!			    : number;			// if first block: 0
	previous_hash!	: string;			// hash from previous block
	timestamp!		  : number;			// UNIX-time
	public_message!	: string;			// public message (encrypted with sk, decrypt with pk)
	private_data!   : string;			// private userdata (encrypted with pk, decrypt with sk)
	hash!			      : string;			// sha-256

	private constructor() {}

	static of(index: number, previous_hash: string,
				timestamp	: number,
				message		: string,
				userdata	: string,
				hash		: string): Block {
		return {
			index: index, previous_hash: previous_hash,
			timestamp: timestamp,
			public_message: message,
			private_data: userdata,
			hash: hash
		};
	}
}

class BlockChain
{
	blocks: Block[] = [];

	public constructor() {}
	
	parseJson(json_text: string): boolean {
    try {
      let json_obj: { chain: Block[] } = JSON.parse(json_text);
      this.blocks.splice(0, this.blocks.length);
      this.blocks.push(...(json_obj.chain));
      return true;
    }
    catch (e) {
      return false;
    }
	}

	getJsonString(): string {
		let json_obj: { chain: Block[] } = { chain: this.blocks };
		return JSON.stringify(json_obj, null, 4);
	}

	genesis(): Block | undefined {
		return this.blocks.at(0);
	}

	tryPush(message: string, userdata: string, pow_nounce: number): boolean {
		let index			: number = this.blocks.length;
		let previous_hash	: string = (index != 0) ? this.blocks[index-1].hash : "";
		let timestamp		: number = Date.now();
		let hash			: string = toHash(previous_hash + pow_nounce.toString());
		
		if (!validateHash(hash))
			return false;
		else {
			this.blocks.push(Block.of(index, previous_hash, timestamp, message, userdata, hash));
			return true;
		}
	}

	mineAndPush(message: string, userdata: string): boolean {
		let index			: number = this.blocks.length;
		let previous_hash	: string = (index != 0) ? this.blocks[index-1].hash : "";
		let nounce			: number = mine(previous_hash);
		if (nounce != Number.NaN) {
			this.tryPush(message + " ([demo] mined nounce: " + nounce.toString() + ")", userdata, nounce);
			return true;
		}
		else {
			return false;
		}
	}
}


function toHash(pow_string: string): string {
	return crypto.createHash("sha256").update(pow_string.toString()).digest("hex");
}

function validateHash(hash: string): boolean {
	// digit head only	(  /^[\d]/  )
	//if (hash.match(/^[\d]/))
	//	return true;
	//return false;
	return hash.startsWith("000");
}

function mine(previous_hash: string): number {
	for (let i: number = 0; i < s_maxNounce; i++)
		if (validateHash(toHash(previous_hash + i.toString())))
			return i;
	return Number.NaN;
}

function jsonSectionHtml(chain: BlockChain): string {
  const json_text       = s_chain.getJsonString();

  return (`
    <form action="/loadJson">
    <p>This is blockchain.json:</p>
    <textarea id="json_file" name="json_file" rows="15" cols="100">${json_text}</textarea>
    <br>
    <input type="submit" value="Load above blockchain.json">
    </form>
  `);
}

function addBlkHtml(): string {
  return (`
    <p>To push a custom block:</p>
    <form action="/mineBlock">
    <label for="hkid">HKID</label><br>
    <input type="text" id="hkid" name="hkid"><br>
    <label for="patient">Patient</label><br>
    <input type="text" id="patient" name="patient"><br>
    <label for="doctor">Doctor</label><br>
    <input type="text" id="doctor" name="doctor"><br>
    <label for="date">Date</label><br>
    <input type="text" id="date" name="date"><br>
    <label for="data">Private data (encrypted in reality)</label><br>
    <textarea id="data" name="data" rows="4" cols="50"></textarea><br><br>
    <label for="max_nounce">Max attempts of mining:</label>
    <input type="text" id="max_nounce" name="max_nounce" value="${s_maxNounce}">
    <input type="submit" value="Mine a new Block">
    </form>
  `);
}

function blkTableHtml(blk: Block): string {
  const index           = blk.index.toString() + ((blk.index == 0) ? " (Genesis Block)" : "");
  const previous_hash   = ((blk.previous_hash == "") ? "" : ("0x" + blk.previous_hash));
  const timestamp       = new Date(blk.timestamp).toString() + " (" + blk.timestamp + ")";
  const public_message  = blk.public_message.replaceAll("\n", "<br>").replaceAll("\t", "&#9;");
  const private_data    = blk.private_data.replaceAll("\n", "<br>").replaceAll("\t", "&#9;");
  const hash            = "0x" + blk.hash.replace("000", `<span style="color: #ff0000;"><u>000</u></span>`);

  return (`
    <table style="border-collapse: collapse; width: 700px;" border="1">
    <tbody>
    <tr>
    <td style="width: 50%;">Block Index</td>
    <td style="width: 50%;">${index}</td>
    </tr>
    <tr>
    <td style="width: 50%;">Previous Hash</td>
    <td style="width: 50%;">${previous_hash}</td>
    </tr>
    <tr>
    <td style="width: 50%;">Timestamp</td>
    <td style="width: 50%;">${timestamp}</td>
    </tr>
    <tr>
    <td style="width: 50%;">Public message<br />(signed with a Public Key)</td>
    <td style="width: 50%;">${public_message}</td>
    </tr>
    <tr>
    <td style="width: 50%;">Private user data<br />(encrypted with a Private Key)</td>
    <td style="width: 50%;">${private_data}<br /><br />(encrypted in reality)</td>
    </tr>
    <tr>
    <td style="width: 50%;">Hash</td>
    <td style="width: 50%;">${hash}</td>
    </tr>
    </tbody>
    </table>

    <br><br><br>
    `);
}

var s_chain: BlockChain = new BlockChain();
var s_maxNounce: number    = 70000;

function main() {
  s_chain.mineAndPush(
`HKID   : A1234567(8)
Patient : IP Man
Doctor  : Yuen, Kwok-yung
Date    : 2022-05-28`,
`Medical records:

BMI22.3
Applied surgery`
  );

  s_chain.mineAndPush(
`HKID   : B1234567(8)
Patient : 愛新覺羅.Ching
Doctor  : Lee, Ka-shing
Date    : 2022-05-28`,
`Medical records:

BMI 26
Obesity`
  );
}

main();