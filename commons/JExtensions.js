if (!Function.prototype.neoBind) {
    /**Closes the context and any number of parameters. That is, returns
     * closured function.
     *
     * ����������: ���� �� ���������� neoBind ��� ��������� ���������� �
     * ����������, �� � ���������� ������� ����������� �� ��������� ����
     * �������, � "���������", ������� ����� ��� �������� ���� �������.
     * ������� ������ ����� ������� � ������ ������� ���������
     * arguments.callee (��������, ���: Application.removeListener(event.id,
     * arguments.callee))
     * ��� ��� arguments.callee - ��� ��� ������ ������.
     * ����� ������������ �� arguments.callee, � arguments.callee.caller.
     * �� ��� �������� ��������� ��� deprecated (the deprecation is due to
     * current ECMAScript design principles)
     * � ���� �� arguments.callee.caller ������ ������������ �
     * ���������� (Closure Compiler).
     * ��� ��� � ������ ADVANCED_OPTIMIZATION ���������� ������������ �����
     * ����������� ��������� �������, ����� ��������� ���� ����� ���������
     * caller.
     *
     * �������, ����� ����������� neoBind ��� �������, ������� ����������
     * arguments.callee ��� �������� �������,
     * �������� ��� �� arguments[arguments.length-1] - ��� ��������� �������� �
     * �������, � ������� ���������� ������ �� ��������� callee.
     * @author P.Klimashkin
     * @param {!Object} scope Context, that becomes 'this' in function.
     * @param {!Array=} bind_args Array of parameters.
     * @return {!Function} Closured function.*/
    Function.prototype.neoBind = function(scope, bind_args) {
        /**@type {!Function}*/
        var fn = this;
        return function() {
            /**@type {!Array}*/
            var args = bind_args ?
                Array.prototype.slice.call(arguments).concat(bind_args) :
                Array.prototype.slice.call(arguments);
            args.push(arguments.callee);
            var res;
            try {
                res = fn.apply(scope, args);
            } catch (e) {
                var s = '';
                try {
                    s = fn.toString();
                } catch (e1) {
                }
                if (s) e.message += ' Failed bound function: ' + s;
                throw e;
            }
            return res;
        };
    };
}

if(!Array.isArray) {
  Array.isArray = function (vArg) {
    return vArg.constructor === Array;
  };
}

/** 
 * JSON.minify()
 * v0.1 (c) Kyle Simpson
 * MIT License
 */
(function(global){
	if (typeof global.JSON == "undefined" || !global.JSON) {
		global.JSON = {};
	}
	
	global.JSON.minify = function(json) {
		
		var tokenizer = /"|(\/\*)|(\*\/)|(\/\/)|\n|\r/g,
			in_string = false,
			in_multiline_comment = false,
			in_singleline_comment = false,
			tmp, tmp2, new_str = [], ns = 0, from = 0, lc, rc;
		
		tokenizer.lastIndex = 0;
		
		while (tmp = tokenizer.exec(json)) {
			lc = RegExp.leftContext;
			rc = RegExp.rightContext;
			if (!in_multiline_comment && !in_singleline_comment) {
				tmp2 = lc.substring(from);
				if (!in_string) {
					tmp2 = tmp2.replace(/(\n|\r|\s)*/g,"");
				}
				new_str[ns++] = tmp2;
			}
			from = tokenizer.lastIndex;
			
			if (tmp[0] == "\"" && !in_multiline_comment && !in_singleline_comment) {
				tmp2 = lc.match(/(\\)*$/);
				if (!in_string || !tmp2 || (tmp2[0].length % 2) == 0) {	// start of string with ", or unescaped " character found to end string
					in_string = !in_string;
				}
				from--; // include " character in next catch
				rc = json.substring(from);
			}
			else if (tmp[0] == "/*" && !in_string && !in_multiline_comment && !in_singleline_comment) {
				in_multiline_comment = true;
			}
			else if (tmp[0] == "*/" && !in_string && in_multiline_comment && !in_singleline_comment) {
				in_multiline_comment = false;
			}
			else if (tmp[0] == "//" && !in_string && !in_multiline_comment && !in_singleline_comment) {
				in_singleline_comment = true;
			}
			else if ((tmp[0] == "\n" || tmp[0] == "\r") && !in_string && !in_multiline_comment && in_singleline_comment) {
				in_singleline_comment = false;
			}
			else if (!in_multiline_comment && !in_singleline_comment && !(/\n|\r|\s/.test(tmp[0]))) {
				new_str[ns++] = tmp[0];
			}
		}
		new_str[ns++] = rc;
		return new_str.join("");
	};
})(global);

/**
 * Extend
 */
Object.defineProperty(Object.prototype, "extend", {
    enumerable: false,
    value: function(from) {
        var props = Object.getOwnPropertyNames(from),
			dest = this;
        props.forEach(function(name) {
			Object.defineProperty(dest, name, Object.getOwnPropertyDescriptor(from, name));
        });
        return this;
    }
});