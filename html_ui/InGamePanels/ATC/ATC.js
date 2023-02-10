var g_fadeDelay = 0;
function startFadeDelay() {
}
function stopFadeDelay(clear) {
    var atc = document.querySelector("ingame-ui");
    if (atc && atc.classList.contains("inactive")) {
        atc.classList.remove("inactive");
        if (!clear)
            startFadeDelay();
    }
    if (clear)
        clearInterval(g_fadeDelay);
}
function UpdateInputTextValue(_sSectionName, _sValue) {
    let HTMLdivSection = (document.getElementById(_sSectionName));
    let SectionText = HTMLdivSection.getElementsByTagName("input")[0];
    if (SectionText != null && SectionText != document.activeElement)
        SectionText.value = _sValue;
    else {
        let SectionText = HTMLdivSection.getElementsByClassName("value")[0];
        if (SectionText != null && SectionText != document.activeElement)
            SectionText.innerText = _sValue;
    }
}
class ATCRadioData {
}
class ATCDialogLine {
}
class ATCDialogData {
    constructor() {
        this.IsOn = false;
    }
}
class ATCListener extends ViewListener.ViewListener {
    onUpdateATCData(callback) {
        this.on("UpdateATCAllData", callback);
    }
    onUpdateDialogs(callback) {
        this.on("UpdateATCDialogsData", callback);
    }
    onUpdatePromptAndOptions(callback) {
        this.on("UpdateATCPromptAndOptionsData", callback);
    }
    onUpdateATISData(callback) {
        this.on("UpdateATCATISData", callback);
    }
    onUpdateATCDRadioData(callback) {
        this.on("UpdateATCDRadioData", callback);
    }
    onUpdateCopilotState(callback) {
        this.on("UpdateCopilotState", callback);
    }
}
function RegisterATCListener(callback) {
    return RegisterViewListenerT("JS_LISTENER_ATC", callback, ATCListener);
}
class ATCPanelElement extends TemplateElement {
    constructor() {
        super(...arguments);
        this.ATCisLoaded = false;
        this.updateLoop = () => {
            if (!this.ATCisLoaded) {
                return;
            }
            if (this.sEventCurrentlySending != null) {
                if (this.iEventSendingSkipped < 10)
                    this.iEventSendingSkipped++;
                else
                    this.ATCListener.trigger(this.sEventCurrentlySending);
            }
            requestAnimationFrame(this.updateLoop);
        };
        this.updateScrolls = () => {
            this.dialogScroll.updateSizes();
            this.optionsScroll.updateSizes();
        };
        this.onDataUpdate = (data) => {
            this.updateATCState(data.IsOn);
            this.SetDialogsDatas(data);
            this.SetPromptAndOptionsData(data);
            this.SetATISDatas(data);
            stopFadeDelay(false);
        };
        this.onUpdateDialogs = (data) => {
            this.SetDialogsDatas(data);
            this.updateATCState(data.IsOn);
            stopFadeDelay(false);
        };
        this.onUpdateOptions = (data) => {
            this.SetPromptAndOptionsData(data);
            this.updateATCState(data.IsOn);
            stopFadeDelay(false);
        };
        this.onUpdateATISData = (data) => {
            this.updateATCState(data.IsOn);
            this.SetATISDatas(data);
            stopFadeDelay(false);
            var comSwitch = document.getElementById("ComSwitch");
            comSwitch.classList.toggle("hide", !data.CanSwitchCom1Com2);
        };
        this.onUpdateRadioData = (data) => {
            this.updateATCState(data.IsOn);
            this.SetRadioData(data);
        };
        this.onUpdateCopilotState = (bVal) => {
            window.document.body.classList.toggle("bCopilotActivated", bVal);
            let ToggleButtonCopilot = document.getElementById("Copilot");
            if (ToggleButtonCopilot !== null) {
                ToggleButtonCopilot.setValue(bVal);
            }
            this.updateScrollPos();
        };
    }
    get templateID() { return "ATC_PANEL_TEMPLATE"; }
    connectedCallback() {
        super.connectedCallback();
        this.dialogScroll = this.querySelector('#ATCDialogs');
        this.optionsScroll = this.querySelector('#ATCOpromptOptions');
        let ingameUI = document.querySelector("ingame-ui");
        if (ingameUI) {
            ingameUI.addEventListener('rectUpdate', this.updateScrolls);
            ingameUI.addEventListener('OnResize', this.updateScrolls);
        }
        this.ATCListener = RegisterATCListener(() => {
            this.updateScrollPos();
            var atc = document.querySelector("ingame-ui");
            atc.addEventListener("mouseenter", function () {
                stopFadeDelay(true);
            });
            atc.addEventListener("panelActive", (e) => {
                this.updateScrollPos();
            });
            startFadeDelay();
            atc.addEventListener("mouseleave", function () {
                startFadeDelay();
            });
            if (document.getElementById("Close"))
                document.getElementById("Close").addEventListener("click", () => { this.ATCListener.trigger("PANEL_ATC_HIDE"); });
            document.getElementById("RadioSwap").addEventListener('mousedown', () => {
                this.ATCListener.trigger("AP_COM1_SWAP_CLICKED");
            });
            this.BindRepeatingOnButton(document.getElementById("Com1Plus"), "AP_COM1_PLUS_CLICKED");
            this.BindRepeatingOnButton(document.getElementById("Com1Minus"), "AP_COM1_MINUS_CLICKED");
            BindInputTextToEnter("Com1StandbyFrequency", "AP_COM1_STANDBY_SET");
            this.ATCisLoaded = true;
            requestAnimationFrame(this.updateLoop);
        });
        this.RegisterATCCallbacks();
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.ATCisLoaded = false;
    }
    BindRepeatingOnButton(_eBtn, _sEvent) {
        _eBtn.addEventListener('mousedown', () => {
            this.ATCListener.trigger(_sEvent);
            this.sEventCurrentlySending = _sEvent;
            this.iEventSendingSkipped = 0;
            _eBtn.classList.add("button-active");
        });
        _eBtn.addEventListener('mouseup', function () {
            this.sEventCurrentlySending = null;
            _eBtn.classList.remove("button-active");
        });
        _eBtn.addEventListener('mouseleave', function () {
            this.sEventCurrentlySending = null;
            _eBtn.classList.remove("button-active");
        });
    }
    RegisterATCCallbacks() {
        this.ATCListener.onUpdateATCData(this.onDataUpdate);
        this.ATCListener.onUpdateDialogs(this.onUpdateDialogs);
        this.ATCListener.onUpdatePromptAndOptions(this.onUpdateOptions);
        this.ATCListener.onUpdateATISData(this.onUpdateATISData);
        this.ATCListener.onUpdateATCDRadioData(this.onUpdateRadioData);
        this.ATCListener.on("UpdateCopilotState", this.onUpdateCopilotState);
    }
    updateATCState(_on) {
        document.querySelector(".RadioOn").classList.toggle("hide", !_on);
        document.querySelector(".RadioOff").classList.toggle("hide", _on);
        this.updateScrollPos();
    }
    SetDialogsDatas(data) {
        Utils.RemoveAllChildren(this.dialogScroll.getContent());
        var n = data.Dialogs.length - 50;
        if (n < 0) {
            n = 0;
        }
        for (var i = n; i < data.Dialogs.length; i++) {
            var elem = document.createElement("li");
            let currentData = data.Dialogs[i];
            if (currentData.Message.length != 0) {
                let div = new UIElement();
                div.classList.add('wrapper');
                div.setAttribute("items-to-read", ".message");
                let span = document.createElement('div');
                span.classList.add('message');
                span.innerHTML = `<span><b>${currentData.Emitter}</b> : ${currentData.Message}</span>`;
                let divLeft = document.createElement('div');
                divLeft.classList.add('meta');
                div.appendChild(divLeft);
                div.appendChild(span);
                elem.appendChild(div);
                if (currentData.Type == 1) {
                    elem.className = "ATCDialogs_Agent";
                    let icon = document.createElement('icon-element');
                    icon.setAttribute('icon-url', '/icons/ATC/ICON_ATC_NO_MARGIN.svg');
                    divLeft.appendChild(icon);
                }
                else if (currentData.Type == 2)
                    elem.className = "ATCDialogs_Aircraft";
                else if (currentData.Type == 5)
                    elem.className = "ATCDialogs_ATIS";
                this.dialogScroll.addRealChild(elem);
            }
        }
        this.updateScrollPos();
        this.dialogScroll.scrollToBottom();
    }
    SetPromptAndOptionsData(data) {
        let differentOptionSize = !this.optionData || data.Options.length != this.optionData.length;
        this.optionData = data.Options;
        var container = document.getElementById("ATCOpromptOptions");
        var prompt = document.getElementById("ATCPrompt");
        var options = document.getElementById("ATCOptions");
        while (prompt.firstChild) {
            prompt.removeChild(prompt.firstChild);
        }
        while (options.firstChild) {
            options.removeChild(options.firstChild);
        }
        let activeNumber = 0;
        var elem = document.createElement("li");
        elem.innerHTML = data.Prompt;
        elem.className = "ATCPrompt_Prompt";
        prompt.appendChild(elem);
        for (var i = 0; i < data.Options.length; i++) {
            if (!data.OptionsActive[i]) {
                continue;
            }
            var elemdiv = document.createElement("div");
            elemdiv.className = "ATCOptions_Clickable";
            if (data.Options[i].length != 0) {
                activeNumber++;
                const regex = /(\d){1} - (.*)/g;
                let result = regex.exec(data.Options[i]);
                let btn = new NewPushButtonElement;
                btn.classList.add('condensed-interactive');
                btn.disable(data.MessageBeingPlayed && !data.OptionsNoMsg[i]);
                btn.classList.add('small');
                btn.setAttribute('title', result[1] + " - " + result[2]);
                btn.addEventListener("OnValidate", function (k) {
                    this.ATCListener.trigger("ATC_SELECT_OPTION", k);
                }.bind(this, i));
                elemdiv.appendChild(btn);
            }
            options.appendChild(elemdiv);
            this.updateScrollPos();
        }
        container.classList.toggle('hide', data.MessageBeingPlayed || activeNumber == 0);
        container.style.setProperty('--nbButtons', activeNumber.toString());
        container.classList.remove('hide');
        this.updateScrolls();
        if (differentOptionSize) {
            this.dialogScroll.scrollToBottom();
        }
        if (UINavigation.current == null && UINavigation.KeysMode) {
            let defaultButton = options.querySelector("new-push-button");
            if (defaultButton)
                defaultButton.focusByKeys();
        }
    }
    SetATISDatas(data) {
        document.getElementById("ATCATISdiv").innerHTML =
            '<marquee id="ATCATIS" class="scroll-left" loop ="1">' +
                data.LastATISMessage +
                '</marquee>';
        this.updateScrolls();
    }
    SetRadioData(data) {
        var standBy = data.CurrentRadio.StandByFrequency;
        var active = data.CurrentRadio.ActiveFrequency;
        UpdateInputTextValue("Com1ActiveFrequency", active.toFixed(3));
        UpdateInputTextValue("Com1StandbyFrequency", standBy.toFixed(3));
        this.updateComButton("switchCom1", data.Com1);
        this.updateComButton("switchCom2", data.Com2);
        this.updateComButton("switchCom3", data.Com3);
        this.updateScrolls();
    }
    updateComButton(id, data) {
        let com = document.getElementById(id);
        if (com) {
            TemplateElement.call(com, () => {
                com.title = data.ComName;
                com.subtitle = data.Tower;
                com.metaData = data.ActiveFrequency.toFixed(3);
                com.setVisible(data.IsAvailable);
                this.updateScrolls();
            });
        }
    }
    updateScrollPos() {
        this.updateScrolls();
    }
}
window.customElements.define('atc-panel', ATCPanelElement);
checkAutoload();
const easeInOutQuad = function (t, b, c, d) {
    t /= d / 2;
    if (t < 1)
        return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
};
function vhTOpx(value) {
    var w = window, d = document, e = d.documentElement, g = d.getElementsByTagName('body')[0], x = w.innerWidth || e.clientWidth || g.clientWidth, y = w.innerHeight || e.clientHeight || g.clientHeight;
    var result = (y * value) / 100;
    return result;
}
function BindInputTextToEnter(_sSection, _sEvent) {
    let eBtn = document.getElementById(_sSection).getElementsByTagName("input")[0];
    eBtn.addEventListener('keyup', function (event) {
        if (event.keyCode == 13) {
            eBtn.blur();
        }
    });
    eBtn.addEventListener('blur', (event) => {
        let iValue = parseFloat(eBtn.value);
        if (!isNaN(iValue)) {
            this.ATCListener.trigger(_sEvent, iValue);
        }
    });
}
checkAutoload();
//# sourceMappingURL=ATC.js.map